import { AwsClient } from "aws4fetch";

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://9q79vl-3000.csb.app",
  "https://lunepusa.pages.dev",
  "http://localhost:3000",
  "https://lunepusa.com",
];

// Simple SHA-256 hash (working version)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function withCors(response, request) {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return response;
}

function getTagsArray(tagString) {
  if (!tagString) return [];
  return tagString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// Generate signed token (HMAC-SHA256, no external lib)
async function generateToken(payload, env) {
  const header = btoa(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  ).replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=+$/, "");
  const data = `${header}.${payloadB64}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  ).replace(/=+$/, "");
  return `${data}.${signatureB64}`;
}

// Validate token
async function validateToken(token, env) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );
  const signature = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(data),
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Helper: Refresh Gmail access token using stored refresh token
async function refreshGmailToken(env) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GMAIL_CLIENT_ID,
      client_secret: env.GMAIL_CLIENT_SECRET,
      refresh_token: env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(
      "Failed to refresh Gmail token: " +
        (data.error_description || data.error || "unknown"),
    );
  }
  return data.access_token;
}

async function getUser(request, env) {
  const bucket = env.Media;
  const bucketName = "lunepusa";
  const db = env.Db;
  const kv = env.kv;
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await validateToken(token, env);
  if (!payload) return null;

  return await db
    .prepare(
      "SELECT id, username, is_admin, subscription_expires, favorite_tags, muted_tags, purchased_dates, saved_payment_pairs, wallet FROM users WHERE id = ?",
    )
    .bind(payload.userId)
    .first();
}

export default {
  async fetch(request, env, ctx) {
    // Assign the env bindings once per request
    const bucket = env.Media;
    const bucketName = "lunepusa";
    const db = env.Db;
    const kv = env.kv;

    const url = new URL(request.url);

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request);
    }

    let response;

    // All routes go here — ensures CORS is applied to everything
    if (url.pathname === "/me") {
      const user = await getUser(request, env);
      response = Response.json({
        user: user || null,
      });
    }

    // Unified login/signup — returns token
    else if (url.pathname === "/login" && request.method === "POST") {
      const { username, password, mode = "login" } = await request.json();
      console.log("Login attempt:", {
        username,
        mode,
        hasPassword: !!password,
      });
      if (!username || !password) {
        response = new Response(
          JSON.stringify({
            success: false,
            error: "Missing fields",
          }),
          {
            status: 400,
          },
        );
      } else if (mode === "signup") {
        const existing = await db
          .prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)")
          .bind(username)
          .first();
        if (existing) {
          response = new Response(
            JSON.stringify({
              success: false,
              error: "Username taken",
            }),
            {
              status: 409,
            },
          );
        } else {
          const passwordHash = await hashPassword(password);
          const result = await db
            .prepare(
              `
            INSERT INTO users (username, password_hash, is_admin, subscription_expires)
            VALUES (?, ?, 0, 0)
            RETURNING id
          `,
            )
            .bind(username, passwordHash)
            .first();
          if (result) {
            // Set default muted tags for new user
            const defaultMuted =
              "taboo,scat,fart,cnc,dubcon,race_play,bnwo,age play,blackmail fetish,blood,breathplay,hypno,somno,monster_dildo,knotted_dildo,tentacle,werewolf";
            await db
              .prepare(
                `
              UPDATE users SET muted_tags = ? WHERE id = ?
            `,
              )
              .bind(defaultMuted, result.id)
              .run();
            const payload = {
              userId: result.id,
              username,
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
            };
            const token = await generateToken(payload, env);
            response = new Response(
              JSON.stringify({
                success: true,
                token,
              }),
              {
                status: 200,
              },
            );
          } else {
            response = new Response(
              JSON.stringify({
                success: false,
                error: "Create failed",
              }),
              {
                status: 500,
              },
            );
          }
        }
      } else {
        const user = await db
          .prepare(
            "SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?)",
          )
          .bind(username)
          .first();
        console.log("User query result:", user ? "found" : "not found");
        if (user) {
          console.log("Stored hash:", user.password_hash);
          console.log("Computed hash:", await hashPassword(password));
          console.log(
            "Hash match:",
            user.password_hash === (await hashPassword(password)),
          );
        }
        if (user && user.password_hash === (await hashPassword(password))) {
          const payload = {
            userId: user.id,
            username: user.username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
          };
          const token = await generateToken(payload, env);
          response = new Response(
            JSON.stringify({
              success: true,
              token,
            }),
            {
              status: 200,
            },
          );
        } else {
          response = new Response(
            JSON.stringify({
              success: false,
              error: "Invalid credentials",
            }),
            {
              status: 401,
            },
          );
        }
      }
    } else if (url.pathname === "/logout" && request.method === "POST") {
      response = new Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
        },
      );
    }
    // Admin upload-batch (legacy)
    else if (url.pathname === "/upload-batch" && request.method === "POST") {
      const user = await getUser(request, env);
      if (!user || !user.is_admin) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        const formData = await request.formData();
        const files = formData.getAll("files");
        const groups = {};
        files.forEach((file) => {
          const match = file.name.match(/^(\d{8})/);
          const dateKey = match ? match[1] : "UnknownDate";
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(file);
        });
        let successCount = 0;
        const errors = [];
        for (const [dateKey, dateFiles] of Object.entries(groups)) {
          const folderPrefix = `media/${dateKey}/`;
          for (const file of dateFiles) {
            try {
              let cleanName = file.name;
              if (cleanName.startsWith("PXL_")) {
                cleanName = cleanName.substring(4);
              }
              const objectKey = folderPrefix + cleanName;
              await bucket.put(objectKey, await file.arrayBuffer(), {
                httpMetadata: {
                  contentType: file.type,
                },
              });
              const createdDateInt = parseInt(dateKey, 10) || 0;
              await db
                .prepare(
                  `
                INSERT INTO media
                (object_key, created_date, caption, tags, is_public, file_type)
                VALUES (?, ?, '', 'lunepusa', 0, ?)
              `,
                )
                .bind(objectKey, createdDateInt, file.type)
                .run();
              successCount++;
            } catch (e) {
              errors.push({
                file: file.name,
                error: e.message,
              });
            }
          }
        }
        response = Response.json({
          successCount,
          errors,
        });
      }
    } else if (url.pathname === "/media" && request.method === "GET") {
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      const limit = parseInt(url.searchParams.get("limit") || "100", 10);
      const q = url.searchParams.get("q") || "";
      console.log("=== MEDIA SEARCH DEBUG START ===");
      console.log("Received q:", q || "(empty)");
      console.log("Offset:", offset, "Limit:", limit);

      const user = await getUser(request, env);

      let whereConditions = [];
      let binds = [];
      let orClauses = [];

      // ────────────────────────────────────────────────
      // Your existing q parsing logic — completely unchanged
      // ────────────────────────────────────────────────
      if (q.trim()) {
        const deurl = q
          .replaceAll("%7E", "~")
          .replaceAll("%2B", "+")
          .replaceAll("%2D", "-");
        const orGroupsRaw = deurl.trim().split("~");
        console.log("OR groups (~ split):", orGroupsRaw);
        let orGroups = [];
        let excludeGroups = [];
        orGroupsRaw.forEach((rawGroup) => {
          let isExclude = false;
          let group = rawGroup.trim();
          if (group.startsWith("-")) {
            isExclude = true;
            group = group.slice(1).trim();
          }
          const andTerms = group
            .split("+")
            .map((t) => t.trim())
            .filter((t) => t);
          console.log(`AND terms in group (exclude: ${isExclude}):`, andTerms);
          if (isExclude) {
            excludeGroups.push(andTerms);
          } else {
            orGroups.push(andTerms);
          }
        });
        console.log("Final OR groups:", orGroups);
        console.log("Final exclude groups:", excludeGroups);

        orGroups.forEach((group) => {
          if (group.length === 1) {
            const term = group[0];
            const pattern = `%${term}%`;
            console.log(`Adding OR term "${term}"`);
            orClauses.push(`
          (LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR
           (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo'))
        `);
            binds.push(pattern, pattern, pattern, term, term);
          } else {
            const andClauses = [];
            group.forEach((term) => {
              const pattern = `%${term}%`;
              console.log(`Adding AND term "${term}"`);
              andClauses.push(`
            (LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR
             (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo'))
          `);
              binds.push(pattern, pattern, pattern, term, term);
            });
            whereConditions.push(`(${andClauses.join(" AND ")})`);
          }
        });
        if (orClauses.length > 0) {
          whereConditions.push(`(${orClauses.join(" OR ")})`);
        }

        excludeGroups.forEach((group) => {
          const excludeClauses = [];
          group.forEach((term) => {
            const pattern = `%${term}%`;
            console.log(`Adding EXCLUDE term "${term}"`);
            excludeClauses.push(`
          NOT (
            LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR
            (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo')
          )
        `);
            binds.push(pattern, pattern, pattern, term, term);
          });
          whereConditions.push(excludeClauses.join(" AND "));
        });
      } else {
        console.log("No query - returning all media");
      }

      // ────────────────────────────────────────────────
      // NEW: Strict hiding logic — only lunepusa sees everything
      // ────────────────────────────────────────────────
      if (user?.username !== "lunepusa") {
        // 1. Start with the standard rule: don't show hidden items
        let hideClause = "tags NOT LIKE '%hidden%'";

        const dates = (user?.purchased_dates || "")
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0);

        // 2. If the user has purchases, add them as an EXCEPTION
        if (dates.length > 0) {
          const placeholders = dates.map(() => "?").join(",");
          const purchaseMatch = `TRIM(REPLACE(CAST(created_date AS TEXT), '.0', '')) IN (${placeholders})`;

          // This is the key: (Normal stuff) OR (My exceptions)
          hideClause = `(${hideClause} OR ${purchaseMatch})`;
          binds.push(...dates);
        }

        // 3. Add the final clause to your query conditions
        whereConditions.push(hideClause);

        console.log("Final hideClause:", hideClause);
      } // If user is lunepusa → no hiding applied at all

      let query = `
    SELECT object_key, created_date, caption, tags, file_type
    FROM media
  `;

      if (whereConditions.length > 0) {
        query += ` WHERE ` + whereConditions.join(" AND ");
      }

      query += ` ORDER BY created_date DESC, id DESC LIMIT ? OFFSET ?`;
      binds.push(limit, offset);

      console.log("Final SQL query:", query);
      console.log("Final binds:", binds);

      try {
        const mediaList = await db
          .prepare(query)
          .bind(...binds)
          .all();
        console.log(
          "Query executed - returned rows:",
          mediaList.results.length,
        );
        if (mediaList.results.length > 0) {
          console.log("Sample row tags:", mediaList.results[0].tags);
          console.log(
            "Sample row caption:",
            mediaList.results[0].caption || "(empty)",
          );
        }
        const media = mediaList.results.map((row) => ({
          key: row.object_key,
          date: row.created_date
            ? String(row.created_date).replace(".0", "")
            : "Unknown",
          caption: row.caption || "",
          tags: row.tags || "",
          type: row.file_type,
          isVideo: row.file_type?.startsWith("video/") || false,
        }));
        response = Response.json({
          media,
        });
      } catch (err) {
        console.error("Media fetch error:", err);
        response = new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
      console.log("=== MEDIA SEARCH DEBUG END ===");
    }

    // ====================== PRESIGN ======================
    else if (url.pathname === "/presign" && request.method === "POST") {
      try {
        const user = await getUser(request, env);
        if (!user || !user.is_admin) {
          response = new Response("Unauthorized", {
            status: 401,
          });
        } else {
          let files;
          try {
            const body = await request.json();
            files = body.files || body;
          } catch (e) {
            response = Response.json(
              {
                error: "Invalid JSON",
              },
              {
                status: 400,
              },
            );
          }

          if (!files || !Array.isArray(files)) {
            response = Response.json(
              {
                error: "Invalid structure",
              },
              {
                status: 400,
              },
            );
          } else {
            const presigned = [];
            const aws = new AwsClient({
              accessKeyId: env.R2_ACCESS_KEY_ID,
              secretAccessKey: env.R2_SECRET_ACCESS_KEY,
              service: "s3",
              region: "auto",
              unsignableHeaders: new Set(["host"]),
            });

            for (const file of files) {
              let cleanName = file.name || "unnamed_file";
              cleanName = cleanName.replace(/^media\//, "");
              if (cleanName.startsWith("PXL_"))
                cleanName = cleanName.substring(4);

              const objectKey = `media/${cleanName}`;
              const signUrl = new URL(
                `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${objectKey}`,
              );

              const signed = await aws.sign(signUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": file.type || "application/octet-stream",
                },
                aws: {
                  signQuery: true,
                  expires: 600,
                },
              });

              presigned.push({
                objectKey,
                presignedUrl: signed.url,
              });
            }
            response = Response.json({
              presigned,
            });
          }
        }
      } catch (err) {
        console.error("Presign error:", err);
        response = Response.json(
          {
            error: err.message || "Failed",
          },
          {
            status: 500,
          },
        );
      }
    }

    // ====================== UPLOAD COMPLETE ======================
    else if (url.pathname === "/upload-complete" && request.method === "POST") {
      try {
        const user = await getUser(request, env);
        if (!user || !user.is_admin) {
          response = new Response("Unauthorized", {
            status: 401,
          });
        } else {
          try {
            const { objectKey, fileType } = await request.json();
            const filename = objectKey.split("/").pop();
            const dateMatch = filename.match(/^(\d{8})/);
            const createdDate = dateMatch ? parseInt(dateMatch[1], 10) : 0;

            await db
              .prepare(
                `
          INSERT INTO media
            (object_key, created_date, caption, tags, is_public, file_type)
          VALUES (?, ?, '', ?, 0, ?)
          ON CONFLICT(object_key) DO UPDATE SET
            file_type = excluded.file_type
        `,
              )
              .bind(objectKey, createdDate, "lunepusa_f,video", fileType)
              .run();

            console.log(`✅ Safe upload complete: ${objectKey}`);
            response = Response.json({
              success: true,
            });
          } catch (err) {
            console.error("Upload complete error:", err);
            response = Response.json(
              {
                error: err.message,
              },
              {
                status: 500,
              },
            );
          }
        }
      } catch (err) {
        response = Response.json(
          {
            error: "Server error",
          },
          {
            status: 500,
          },
        );
      }
    } else if (url.pathname === "/test-gmail-token") {
      try {
        const token = await refreshGmailToken(env);
        response = new Response(
          `Access token success: ${token.slice(0, 10)}...`,
        );
      } catch (err) {
        console.error("Test gmail token error:", err);
        response = new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    } else if (url.pathname === "/bulk-update" && request.method === "POST") {
      try {
        const {
          keys,
          addedTags = [],
          removedTags = [],
          newDate,
        } = await request.json();
        // Tag update
        if (addedTags.length > 0 || removedTags.length > 0) {
          for (const key of keys) {
            const item = await db
              .prepare("SELECT tags FROM media WHERE object_key = ?")
              .bind(key)
              .first();
            if (item) {
              let current = (item.tags || "")
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
              // Remove first
              if (removedTags.length > 0) {
                current = current.filter((t) => !removedTags.includes(t));
              }
              // Add new
              if (addedTags.length > 0) {
                current = [...new Set([...current, ...addedTags])];
              }
              const updated = current.join(", ");
              await db
                .prepare("UPDATE media SET tags = ? WHERE object_key = ?")
                .bind(updated, key)
                .run();
            }
          }
        }
        // Date/time update (unchanged)
        if (newDate) {
  for (const key of keys) {
    await db
      .prepare("UPDATE media SET created_date = ? WHERE object_key = ?")
      .bind(parseInt(newDate, 10), key)
      .run();
  }
}

response = Response.json({ success: true });

} catch (err) {
        console.error("Bulk update error:", err);
        response = new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    } else if (
      url.pathname === "/change-password" &&
      request.method === "POST"
    ) {
      const user = await getUser(request, env);
      if (!user) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const { currentPassword, newPassword } = await request.json();
          if (!currentPassword || !newPassword) {
            throw new Error("Missing passwords");
          }
          // Fetch stored hash
          const stmt = db
            .prepare("SELECT password_hash FROM users WHERE id = ?")
            .bind(user.id);
          const result = await stmt.first();
          if (!result) {
            throw new Error("User not found");
          }
          // Compare current password
          const currentHash = await hashPassword(currentPassword);
          if (result.password_hash !== currentHash) {
            throw new Error("Current password incorrect");
          }
          // Update with new hash
          const newHash = await hashPassword(newPassword);
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .bind(newHash, user.id)
            .run();
          response = Response.json({
            success: true,
          });
        } catch (err) {
          console.error("Change password error:", err);
          response = new Response(
            JSON.stringify({
              error: err.message,
            }),
            {
              status: 400,
            },
          );
        }
      }
    }
    // GET /admin-users — list all users (admin only)
    else if (url.pathname === "/admin-users" && request.method === "GET") {
      const user = await getUser(request, env);
      if (!user || user.username !== "lunepusa") {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        const users = await db
          .prepare(
            "SELECT id, username, is_admin, subscription_expires, favorite_tags, muted_tags FROM users",
          )
          .all();
        response = Response.json({
          users: users.results,
        });
      }
    }
    // POST /admin-update-user — update admin status or expiry
    else if (
      url.pathname === "/admin-update-user" &&
      request.method === "POST"
    ) {
      const user = await getUser(request, env);
      if (!user || user.username !== "lunepusa") {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        const { userId, is_admin, subscription_expires } = await request.json();
        let query = "UPDATE users SET ";
        let binds = [];
        if (is_admin !== undefined) {
          query += "is_admin = ? ";
          binds.push(is_admin ? 1 : 0);
        }
        if (subscription_expires !== undefined) {
          if (binds.length > 0) query += ", ";
          query += "subscription_expires = ? ";
          binds.push(subscription_expires);
        }
        query += "WHERE id = ?";
        binds.push(userId);
        await db
          .prepare(query)
          .bind(...binds)
          .run();
        response = Response.json({
          success: true,
        });
      }
    } else if (url.pathname === "/tag-stats" && request.method === "GET") {
      try {
        const all = await db.prepare("SELECT tags FROM media").all();
        const countMap = {};
        all.results.forEach((row) => {
          getTagsArray(row.tags || "").forEach((tag) => {
            countMap[tag] = (countMap[tag] || 0) + 1;
          });
        });
        // Sort descending by count
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
        response = Response.json(Object.fromEntries(sorted));
      } catch (err) {
        console.error("Tag stats error:", err);
        response = new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    } else if (url.pathname === "/gallery-stats" && request.method === "GET") {
      try {
        const result = await db
          .prepare(
            `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN file_type LIKE 'image/%' THEN 1 ELSE 0 END) as photos,
            SUM(CASE WHEN file_type LIKE 'video/%' THEN 1 ELSE 0 END) as videos
          FROM media
        `,
          )
          .first();
        response = Response.json({
          photos: result.photos || 0,
          videos: result.videos || 0,
          total: result.total || 0,
        });
      } catch (err) {
        response = new Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    } else if (url.pathname === "/tag-prefs" && request.method === "POST") {
      const user = await getUser(request, env);
      if (!user)
        return new Response("Unauthorized", {
          status: 401,
        });
      const updates = await request.json();
      // Fetch current values
      const current = await db
        .prepare("SELECT favorite_tags, muted_tags FROM users WHERE id = ?")
        .bind(user.id)
        .first();
      const newFavorite =
        updates.favorite_tags !== undefined
          ? updates.favorite_tags
          : current.favorite_tags || "";
      const newMuted =
        updates.muted_tags !== undefined
          ? updates.muted_tags
          : current.muted_tags || "";
      await db
        .prepare(
          `
        UPDATE users SET favorite_tags = ?, muted_tags = ? WHERE id = ?
      `,
        )
        .bind(newFavorite, newMuted, user.id)
        .run();
      response = Response.json({
        success: true,
      });
    }
    // NEW: POST /generate-share-token — admin only
    else if (
      url.pathname === "/generate-share-token" &&
      request.method === "POST"
    ) {
      const user = await getUser(request, env);
      if (!user || !user.is_admin) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const { target_type, target_value } = await request.json();
          if (!["date", "media"].includes(target_type) || !target_value) {
            response = Response.json(
              {
                error: "Invalid target",
              },
              {
                status: 400,
              },
            );
          } else {
            const token = crypto.randomUUID().slice(0, 16);
            await db
              .prepare(
                "INSERT INTO share_links (token, target_type, target_value, created_by) VALUES (?, ?, ?, ?)",
              )
              .bind(token, target_type, target_value, user.id)
              .run();
            const link = `https://lunepusa.pages.dev/share/${token}`;
            response = Response.json({
              success: true,
              link,
            });
          }
        } catch (err) {
          console.error(err);
          response = new Response(
            JSON.stringify({
              error: err.message || "Server error",
            }),
            {
              status: 500,
            },
          );
        }
      }
    }
    // NEW: GET /share/:token — dedicated shared view
    else if (url.pathname.startsWith("/share/") && request.method === "GET") {
      const token = url.pathname.split("/")[2];
      if (!token) {
        response = new Response("Invalid share link", {
          status: 400,
        });
      } else {
        try {
          const share = await db
            .prepare(
              "SELECT target_type, target_value FROM share_links WHERE token = ?",
            )
            .bind(token)
            .first();
          if (!share) {
            response = new Response("Invalid share link", {
              status: 404,
            });
          } else {
            const user = await getUser(request, env);
            // Grant permanent access if logged in and it's a date
            if (user && share.target_type === "date") {
              const current = user.purchased_dates || "";
              const dates = current
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
              if (!dates.includes(share.target_value)) {
                const updated = current
                  ? `${current},${share.target_value}`
                  : share.target_value;
                await db
                  .prepare("UPDATE users SET purchased_dates = ? WHERE id = ?")
                  .bind(updated, user.id)
                  .run();
              }
            }
            // Fetch only shared content
            let query =
              "SELECT object_key, created_date, caption, tags, file_type FROM media WHERE 1=1";
            let binds = [];
            if (share.target_type === "date") {
              query += " AND created_date = ?";
              binds.push(parseInt(share.target_value, 10));
            } else if (share.target_type === "media") {
              query += " AND object_key = ?";
              binds.push(share.target_value);
            }
            query += " ORDER BY created_date DESC, id DESC LIMIT 100";
            const mediaList = await db
              .prepare(query)
              .bind(...binds)
              .all();
            const media = mediaList.results.map((row) => ({
              key: row.object_key,
              date: row.created_date
                ? String(row.created_date).replace(".0", "")
                : "Unknown",
              caption: row.caption || "",
              tags: row.tags || "",
              isVideo: row.file_type?.startsWith("video/") || false,
            }));
            response = Response.json({
              media,
              date: share.target_type === "date" ? share.target_value : null,
            });
          }
        } catch (err) {
          console.error(err);
          response = new Response(
            JSON.stringify({
              error: err.message || "Server error",
            }),
            {
              status: 500,
            },
          );
        }
      }
    }

    // GET /saved-payment-pairs — return the user's current saved pairs
    else if (
      url.pathname === "/saved-payment-pairs" &&
      request.method === "GET"
    ) {
      const user = await getUser(request, env);
      if (!user) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          let pairs = [];
          if (
            user.saved_payment_pairs &&
            user.saved_payment_pairs.trim() !== "[]"
          ) {
            try {
              pairs = JSON.parse(user.saved_payment_pairs);
            } catch (e) {
              console.error("Invalid saved_payment_pairs JSON:", e);
              pairs = [];
            }
          }
          response = Response.json({
            pairs,
          });
        } catch (err) {
          console.error("Get saved pairs error:", err);
          response = Response.json(
            {
              error: "Server error",
            },
            {
              status: 500,
            },
          );
        }
      }
    } else if (
      url.pathname === "/save-payment-pair" &&
      request.method === "POST"
    ) {
      const user = await getUser(request, env);
      if (!user) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const { platform, username } = await request.json();
          if (!platform || !username) {
            response = Response.json(
              {
                error: "Missing platform or username",
              },
              {
                status: 400,
              },
            );
          } else {
            // Safely get current pairs
            let pairs = [];
            const rawPairs = user.saved_payment_pairs;
            if (
              rawPairs &&
              rawPairs.trim() !== "" &&
              rawPairs.trim() !== "null" &&
              rawPairs.trim() !== "[]"
            ) {
              try {
                pairs = JSON.parse(rawPairs);
              } catch (parseErr) {
                console.error(
                  "Invalid JSON in saved_payment_pairs:",
                  parseErr,
                  rawPairs,
                );
                pairs = []; // reset to empty on parse failure
              }
            }

            const newPair = {
              platform: platform.trim(),
              username: username.trim(),
            };

            const exists = pairs.some(
              (p) =>
                p.platform === newPair.platform &&
                p.username === newPair.username,
            );

            if (exists) {
              response = Response.json({
                success: true,
                message: "Pair already saved",
                pairs,
              });
            } else {
              pairs.push(newPair);
              await db
                .prepare(
                  "UPDATE users SET saved_payment_pairs = ? WHERE id = ?",
                )
                .bind(JSON.stringify(pairs), user.id)
                .run();

              response = Response.json({
                success: true,
                message: "Payment pair saved successfully",
                pairs,
              });
            }
          }
        } catch (err) {
          console.error("Save payment pair error:", err);
          response = Response.json(
            {
              error: "Server error",
            },
            {
              status: 500,
            },
          );
        }
      }
    } else if (url.pathname === "/check-payment" && request.method === "POST") {
      const user = await getUser(request, env);
      if (!user) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const { platform, username } = await request.json();
          if (!platform || !username) {
            response = Response.json(
              {
                error: "Missing platform or username",
              },
              {
                status: 400,
              },
            );
          } else {
            const accessToken = await refreshGmailToken(env);

            // Lookup senders for this platform
            const platRow = await db
              .prepare("SELECT senders FROM platforms WHERE platform = ?")
              .bind(platform)
              .first();

            const senders = platRow ? JSON.parse(platRow.senders || "[]") : [];

            let fromClause = "";
            if (senders.length > 0) {
              fromClause = senders.map((s) => `from:${s}`).join(" OR ");
            } else {
              const domain =
                platform.toLowerCase().replace(/\s+/g, "") + ".com";
              fromClause = `from:@${domain}`;
            }

            // Last 7 days only
            const daysBack = 7;
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - daysBack);
            const sinceStr = sinceDate.toISOString().split("T")[0];

            const query = `${fromClause} "${username}" after:${sinceStr}`;

            const listRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );
            const listData = await listRes.json();

            if (!listData.messages || listData.messages.length === 0) {
              response = Response.json({
                success: false,
                message: "No matching emails found in the last 7 days.",
              });
            } else {
              let foundPayments = 0;
              let totalAddedCents = 0;
              let processedIds = [];

              for (const msg of listData.messages) {
                const msgRes = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                );
                const msgData = await msgRes.json();

                const labels = msgData.labelIds || [];

                // Exclude if already claimed or Non-Payment
                if (
                  labels.includes("Label_1909551957303359400") ||
                  labels.includes("Label_2723636466645469159")
                ) {
                  continue;
                }

                // Extract text body
                let bodyText = "";
                const payload = msgData.payload;
                if (payload.parts) {
                  const textPart = payload.parts.find(
                    (p) => p.mimeType === "text/plain",
                  );
                  if (textPart && textPart.body && textPart.body.data) {
                    bodyText = atob(
                      textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"),
                    );
                  }
                } else if (payload.body && payload.body.data) {
                  bodyText = atob(
                    payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
                  );
                }

                // Special handling for "Direct from LunePusa"
                if (platform === "Direct from LunePusa") {
                  const dateHeader = payload.headers.find(
                    (h) => h.name === "Date",
                  )?.value;
                  if (!dateHeader) continue;

                  const sendDate = new Date(dateHeader);
                  if (isNaN(sendDate.getTime())) continue;

                  const mtDate = sendDate.toLocaleString("en-US", {
                    timeZone: "America/Denver",
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  });

                  const [month, day, year] = mtDate.split("/");
                  const creditCode = `CREDIT${month}${day}${year}`;

                  if (!bodyText.includes(creditCode)) {
                    continue;
                  }
                }

                // Find non-zero dollar amount
                const dollarRegex =
                  /\$[1-9]\d*(\.\d{1,2})?|USD\s*[1-9]\d*(\.\d{1,2})?/gi;
                const matches = bodyText.match(dollarRegex);
                if (!matches) continue;

                let paymentCents = 0;
                for (const match of matches) {
                  const dollars = parseFloat(match.replace(/\$|USD\s*/gi, ""));
                  if (dollars > 0) {
                    paymentCents = Math.round(dollars * 100);
                    break;
                  }
                }
                if (paymentCents === 0) continue;

                // Process payment
                let walletData = {
                  balance: 0,
                };
                if (user.wallet && user.wallet.trim() !== "[]") {
                  try {
                    walletData = JSON.parse(user.wallet);
                  } catch (e) {
                    console.error("Invalid wallet JSON:", e);
                  }
                }
                walletData.balance = (walletData.balance || 0) + paymentCents;

                await db
                  .prepare("UPDATE users SET wallet = ? WHERE id = ?")
                  .bind(JSON.stringify(walletData), user.id)
                  .run();

                await db
                  .prepare(
                    "INSERT INTO claimed_payments (user_id, username, platform, gmail_message_id, amount_cents, claimed_at) VALUES (?, ?, ?, ?, ?, ?)",
                  )
                  .bind(
                    user.id,
                    username,
                    platform,
                    msg.id,
                    paymentCents,
                    Math.floor(Date.now() / 1000),
                  )
                  .run();

                // Apply "claimed" label using correct ID
                await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      addLabelIds: ["Label_1909551957303359400"],
                    }),
                  },
                );

                foundPayments++;
                totalAddedCents += paymentCents;
                processedIds.push(msg.id);
              }

              response = Response.json({
                success: foundPayments > 0,
                message:
                  foundPayments > 0
                    ? `Found ${foundPayments} payment(s) totaling $${(totalAddedCents / 100).toFixed(2)} – added to wallet!`
                    : "No valid recent payments found (last 7 days). Contact LunePusa for older payments.",
                processedIds,
              });
            }
          }
        } catch (err) {
          console.error("Check payment error:", err);
          response = Response.json(
            {
              error: "Server error",
            },
            {
              status: 500,
            },
          );
        }
      }
    } else if (url.pathname === "/platforms" && request.method === "GET") {
      const rows = await db
        .prepare(
          "SELECT platform, senders, link_to_page, category, is_favorite, icon, description FROM platforms ORDER BY platform",
        )
        .all();
      response = Response.json({
        platforms: rows.results,
      });
    } else if (url.pathname === "/spend-wallet" && request.method === "POST") {
      const user = await getUser(request, env);
      if (!user) {
        response = new Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const {
            amountCents,
            itemSlug,
            description = "Purchase",
          } = await request.json();
          if (!amountCents || amountCents <= 0 || !itemSlug) {
            response = Response.json(
              {
                error: "Missing or invalid amount/item",
              },
              {
                status: 400,
              },
            );
          } else {
            let walletData = {
              balance: 0,
            };
            if (user.wallet && user.wallet.trim() !== "[]") {
              try {
                walletData = JSON.parse(user.wallet);
              } catch (e) {
                console.error("Invalid wallet JSON:", e);
              }
            }

            const currentBalance = walletData.balance || 0;

            if (currentBalance < amountCents) {
              response = Response.json({
                success: false,
                message: `Insufficient balance. You have $${(currentBalance / 100).toFixed(2)} available.`,
              });
            } else {
              // Deduct from wallet
              walletData.balance = currentBalance - amountCents;

              // Determine days to add based on itemSlug
              let daysToAdd = 0;
              if (itemSlug === "lounge-monthly") {
                daysToAdd = 31;
              } else if (itemSlug === "lounge-yearly") {
                daysToAdd = 365;
              } else if (itemSlug === "lounge-lifetime") {
                daysToAdd = 32850;
              }

              let newExpiry = 0;
              if (daysToAdd > 0) {
                const now = Math.floor(Date.now() / 1000);
                const currentExpiry = user.subscription_expires || 0;
                const baseTime = currentExpiry > now ? currentExpiry : now;
                newExpiry = baseTime + daysToAdd * 24 * 3600;
              }

              await db
                .prepare(
                  "UPDATE users SET wallet = ?, subscription_expires = ? WHERE id = ?",
                )
                .bind(
                  JSON.stringify(walletData),
                  newExpiry || user.subscription_expires, // preserve old if no extension
                  user.id,
                )
                .run();

              // Log to purchases
              await db
                .prepare(
                  "INSERT INTO purchases (user_id, item_slug, amount_cents, description, purchased_at) VALUES (?, ?, ?, ?, ?)",
                )
                .bind(
                  user.id,
                  itemSlug,
                  amountCents,
                  description,
                  new Date().toISOString(),
                )
                .run();

              response = Response.json({
                success: true,
                message:
                  `$${(amountCents / 100).toFixed(2)} spent. New balance: $${(walletData.balance / 100).toFixed(2)}.` +
                  (daysToAdd > 0
                    ? ` Subscription extended by ${daysToAdd} days.`
                    : ""),
              });
            }
          }
        } catch (err) {
          console.error("Spend wallet error:", err);
          response = Response.json(
            {
              error: "Server error",
            },
            {
              status: 500,
            },
          );
        }
      }
    } else if (
      url.pathname === "/migrate-flatten-r2" &&
      request.method === "GET"
    ) {
      try {
        // ADDED LIMIT 50: This avoids hitting Cloudflare's sub-request maximum limit.
        // Every time you refresh, it pulls the next 50 un-migrated items.
        const { results } = await db
          .prepare(
            `
                            SELECT id, object_key, tags 
                            FROM media 
                            WHERE object_key LIKE 'media/________/%'
                            ORDER BY id ASC
                            LIMIT 50
                          `,
          )
          .all();

        if (results.length === 0) {
          return Response.json({
            success: true,
            message:
              "🎉 All historical items have already been completely flattened! There is nothing left to migrate.",
          });
        }

        let movedCount = 0;
        let dbUpdatedCount = 0;
        const resultsLog = [];

        for (const row of results) {
          const oldKey = row.object_key;

          const pathMatch = oldKey.match(/^media\/\d{8}\/(.+)$/);
          if (!pathMatch) continue;

          const originalFilename = pathMatch[1];
          const dotIndex = originalFilename.lastIndexOf(".");
          const baseName =
            dotIndex !== -1
              ? originalFilename.substring(0, dotIndex)
              : originalFilename;
          const extension =
            dotIndex !== -1 ? originalFilename.substring(dotIndex) : "";

          let targetFilename = originalFilename;
          let newKey = `media/${targetFilename}`;
          let updatedTags = row.tags || "";

          const conflictCheck = await db
            .prepare(
              "SELECT id, tags FROM media WHERE object_key = ? AND id != ?",
            )
            .bind(newKey, row.id)
            .first();

          if (conflictCheck) {
            if (row.id < conflictCheck.id) {
              targetFilename = `${baseName}_duplicate${extension}`;
              newKey = `media/${targetFilename}`;
              updatedTags = updatedTags ? `${updatedTags}, delete` : "delete";
              resultsLog.push(
                `[Conflict Resolved] Older row found. Marking duplicate: ${newKey}`,
              );
            } else {
              const olderRowId = conflictCheck.id;
              const olderRowTags = conflictCheck.tags || "";
              const olderTargetFilename = `${baseName}_duplicate${extension}`;
              const olderNewKey = `media/${olderTargetFilename}`;
              const olderUpdatedTags = olderRowTags
                ? `${olderRowTags}, delete`
                : "delete";

              resultsLog.push(
                `[Conflict Resolved] Existing row is older. Relocating old row to: ${olderNewKey}`,
              );

              await db
                .prepare(
                  "UPDATE media SET object_key = ?, tags = ? WHERE id = ?",
                )
                .bind(olderNewKey, olderUpdatedTags, olderRowId)
                .run();

              try {
                const sourceObjectOlder = await bucket.get(newKey);
                if (sourceObjectOlder) {
                  await bucket.put(olderNewKey, sourceObjectOlder.body, {
                    customMetadata: sourceObjectOlder.customMetadata,
                    httpMetadata: sourceObjectOlder.httpMetadata,
                  });
                  await bucket.delete(newKey);
                  movedCount++;
                }
              } catch (e) {
                console.log(
                  `Older asset wasn't present at clean destination yet.`,
                );
              }

              targetFilename = originalFilename;
              newKey = `media/${targetFilename}`;
            }
          }

          // A. MOVE FILE IN R2 STORAGE
          try {
            const sourceObject = await bucket.get(oldKey);
            if (sourceObject) {
              await bucket.put(newKey, sourceObject.body, {
                customMetadata: sourceObject.customMetadata,
                httpMetadata: sourceObject.httpMetadata,
              });
              await bucket.delete(oldKey);
              movedCount++;
            }
          } catch (r2Err) {
            resultsLog.push(
              `[R2 Warning] Object missing from bucket for key: ${oldKey}. Aligning DB anyway.`,
            );
          }

          // B. UPDATE THE CURRENT D1 DATABASE ROW
          await db
            .prepare("UPDATE media SET object_key = ?, tags = ? WHERE id = ?")
            .bind(newKey, updatedTags, row.id)
            .run();

          dbUpdatedCount++;
          resultsLog.push(`Success: ${oldKey} -> ${newKey}`);
        }
        const randomColor =
          "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0");
        response = Response.json({
          success: true,
          trackingColor: randomColor,
          message: `Batch complete. Successfully flattened ${dbUpdatedCount} rows and moved ${movedCount} files.`,
          log: resultsLog,
        });
      } catch (err) {
        console.error("Migration structural routine failure:", err);
        response = new Response(
          JSON.stringify({
            error: err.message || "Failed",
          }),
          {
            status: 500,
          },
        );
      }
    } else if (request.method === "POST" && url.pathname === "/purge-deleted") {
      try {
        // 1. Find all rows that might have the delete tag
        const { results } = await db
          .prepare("SELECT * FROM media WHERE tags LIKE '%delete%'")
          .all();

        let deletedCount = 0;

        for (const row of results) {
          // 2. Double check it's the exact tag "delete"
          const tags = row.tags
            ? row.tags.split(",").map((t) => t.trim().toLowerCase())
            : [];
          if (tags.includes("delete")) {
            // 3. Delete the main file from R2
            await bucket.delete(row.object_key);

            // 4. If it's a video, delete the _thumb.jpg too using our regex
            if (row.file_type && row.file_type.startsWith("video/")) {
              const thumbKey =
                row.object_key.replace(/\.[^/.]+$/, "") + "_thumb.jpg";
              await bucket.delete(thumbKey);
            }

            // 5. Delete the row from D1
            await db
              .prepare("DELETE FROM media WHERE object_key = ?")
              .bind(row.object_key)
              .run();

            deletedCount++;
          }
        }

        // 6. Return success using the JSON helper
        response = Response.json({ success: true, deleted: deletedCount });
      } catch (error) {
        console.error("Purge Delete failure:", error);

        // 7. Return error using the JSON helper
        response = Response.json(
          { error: error.message || "Failed" },
          { status: 500 },
        );
      }
    } else if (url.pathname === "/blur-test") {
      response = new Response("Worker is working! Blur route is active.", {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } else if (url.pathname === "/getFiles" && request.method === "GET") {
      response = Response.json({
        R2_PUBLIC_URL: env.R2_PUBLIC_URL || "https://files.lunepusa.com",
      });
    } else {
      response = new Response("Not found", {
        status: 404,
      });
    }

    // Ensure 'response' is defined before calling withCors
    if (!response) {
      response = new Response("Not Found", {
        status: 404,
      });
    }

    // Apply CORS to EVERY response
    return withCors(response, request);
  },
};
