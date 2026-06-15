import {getUser} from "../Auth/GetUser.js";

 export async function generateShareToken(request, env) {
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
        try {
          const { target_type, target_value } = await request.json();
          if (!["date", "media"].includes(target_type) || !target_value) {
            return Response.json(
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
            return Response.json({
              success: true,
              link,
            });
          }
        } 
      }
    }