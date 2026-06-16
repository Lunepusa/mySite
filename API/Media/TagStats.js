import {getUser} from "../Auth/GetUser.js";
import {getTagsArray} from "./GetTagsArray.js";

 export async function tagStats(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      
        const all = await db.prepare("SELECT tags FROM media").all();
        const countMap = {};
        all.results.forEach((row) => {
          getTagsArray(row.tags || "").forEach((tag) => {
            countMap[tag] = (countMap[tag] || 0) + 1;
          });
        });
        // Sort descending by count
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
        return Response.json(Object.fromEntries(sorted));
      }
    