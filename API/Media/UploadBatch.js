//no longer used?

import {getUser} from "../Auth/GetUser.js";

 export async function uploadBatch(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user || !user.is_admin) {
        return new  Response("Unauthorized", {
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
        return Response.json({
          successCount,
          errors,
        });
      }
    }