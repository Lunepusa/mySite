import {getUser} from "../Auth/GetUser.js";

 export async function purgeDeleted(request, env) {
        const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;  
    
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
        return Response.json({ success: true, deleted: deletedCount });
      }
    