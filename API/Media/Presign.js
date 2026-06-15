
import {getUser} from "../Auth/GetUser.js";

 export async function presign(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      try {
        const user = await getUser(request, env);
        if (!user || !user.is_admin) {
          return New  Response("Unauthorized", {
            status: 401,
          });
        } else {
          let files;
          try {
            const body = await request.json();
            files = body.files || body;
          } catch (e) {
            return = Response.json(
              {
                error: "Invalid JSON",
              },
              {
                status: 400,
              },
            );
          }

          if (!files || !Array.isArray(files)) {
            return = Response.json(
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
            return = Response.json({
              presigned,
            });
          }
        }
      }
    }