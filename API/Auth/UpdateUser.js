import {getUser} from "./GetUser.js";

 export async function updateUser(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user || user.username !== "lunepusa") {
        return new  Response("Unauthorized", {
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
        return Response.json({
          success: true,
        });
      }
    }