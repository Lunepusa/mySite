import {getUser} from "../Auth/GetUser.js";

 export async function media(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
 const url = new URL(request.url);
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
        orClauses.push(`(LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo')) `);
        binds.push(pattern, pattern, pattern, term, term);
      } else {
        const andClauses = [];
        group.forEach((term) => {
          const pattern = `%${term}%`;
          console.log(`Adding AND term "${term}"`);
          andClauses.push(`(LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo'))`);
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
        excludeClauses.push(` NOT ( LOWER(tags) LIKE ? OR LOWER(caption) LIKE ? OR CAST(created_date AS TEXT) LIKE ? OR (file_type LIKE 'video%' AND ? = 'video') OR (file_type LIKE 'image%' AND ? = 'photo') ) `);
        binds.push(pattern, pattern, pattern, term, term);
      });
      whereConditions.push(excludeClauses.join(" AND "));
    });
  } else {
    console.log("No query - returning all media");
  }
  
  if (user?.username !== "lunepusa") {
    let hideClause = "tags NOT LIKE '%hidden%'";

    const dates = (user?.purchased_dates || "")
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
      
    if (dates.length > 0) {
      const placeholders = dates.map(() => "?").join(",");
      const purchaseMatch = `TRIM(REPLACE(CAST(created_date AS TEXT), '.0', '')) IN (${placeholders})`;
      hideClause = `(${hideClause} OR ${purchaseMatch})`;
      binds.push(...dates);
    }

    whereConditions.push(hideClause);
    console.log("Final hideClause:", hideClause);
  } 

  let query = `
SELECT object_key, created_date, caption, tags, file_type
FROM media`;

  if (whereConditions.length > 0) {
    query += ` WHERE ` + whereConditions.join(" AND ");
  }

  query += ` ORDER BY created_date DESC, id DESC LIMIT ? OFFSET ?`;
  binds.push(limit, offset);

  console.log("Final SQL query:", query);
  console.log("Final binds:", binds);

  const mediaList = await db
    .prepare(query)
    .bind(...binds)
    .all();
    
  console.log("Query executed - returned rows:", mediaList.results.length);
  
  if (mediaList.results.length > 0) {
    console.log("Sample row tags:", mediaList.results[0].tags);
    console.log("Sample row caption:", mediaList.results[0].caption || "(empty)");
  }
  
  const media = mediaList.results.map((row) => ({
    key: row.object_key,
    date: row.created_date ? String(row.created_date).replace(".0", "") : "Unknown",
    caption: row.caption || "",
    tags: row.tags || "",
    type: row.file_type,
    isVideo: row.file_type?.startsWith("video/") || false,
  }));
  
  return Response.json({
    media,
  });
}