import {getUser} from "./GetUser.js";

 export async function platforms(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const rows = await db
        .prepare(
          "SELECT platform, senders, link_to_page, category, is_favorite, icon, description FROM platforms ORDER BY platform",
        )
        .all();
      return = Response.json({
        platforms: rows.results,
      });
    } 