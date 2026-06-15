
import {getUser} from "../Auth/GetUser.js";

 export async function bulkUpdate(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      try {
        const {
          keys,
          addedTags = [],
          removedTags = [],
          newDate,
          newCaption
        } = await request.json();
        // Tag update
        if (newCaption !== undefined) {
            for (const key of keys) {
                await db
                    .prepare("UPDATE media SET caption = ? WHERE object_key = ?")
                    .bind(newCaption, key)
                    .run();
            }
        }
        
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
        if (newDate) { for (const key of keys) { await db
      .prepare("UPDATE media SET created_date = ? WHERE object_key = ?")
      .bind(parseInt(newDate, 10), key)
      .run();
       }}return = Response.json({ success: true });} catch (err) {
        console.error("Bulk update error:", err);
        return New  Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    }