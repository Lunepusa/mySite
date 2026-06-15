
import {getUser} from "../Auth/GetUser.js";

 export async function uploadComplete(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      try {
        const user = await getUser(request, env);
        if (!user || !user.is_admin) {
          return new  Response("Unauthorized", {
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
            return Response.json({
              success: true,
            });
          } catch (err) {
            console.error("Upload complete error:", err);
            return Response.json(
              {
                error: err.message,
              },
              {
                status: 500,
              },
            );
          }
        }
      }
    }