import {getUser} from "../Auth/GetUser.js";

export async function share(request, env) {
  const db = env.Db;
      const url = new URL(request.url); 
    const token = url.pathname.split("/share/")[1];
      if (!token) {
        return new  Response("Invalid share link", {
          status: 400,
        });
      } else {
        
          const share = await db
            .prepare(
              "SELECT target_type, target_value FROM share_links WHERE token = ?",
            )
            .bind(token)
            .first();
          if (!share) {
            return new  Response("Invalid share link", {
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
            return Response.json({
              media,
              date: share.target_type === "date" ? share.target_value : null,
            });
          }
        }
      }
    