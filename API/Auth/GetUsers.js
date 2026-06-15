
import {getUser} from "./GetUser.js";

 export async function get-users(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user || user.username !== "lunepusa") {
        return New  Response("Unauthorized", {
          status: 401,
        });
      } else {
        const users = await db
          .prepare(
            "SELECT id, username, is_admin, subscription_expires, favorite_tags, muted_tags FROM users",
          )
          .all();
        return = Response.json({
          users: users.results,
        });
      }
    }