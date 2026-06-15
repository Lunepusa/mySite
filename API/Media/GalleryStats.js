import {getUser} from "../Auth/GetUser.js";

 export async function galleryStats(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      try {
        const result = await db
          .prepare(
            `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN file_type LIKE 'image/%' THEN 1 ELSE 0 END) as photos,
            SUM(CASE WHEN file_type LIKE 'video/%' THEN 1 ELSE 0 END) as videos
          FROM media
        `,
          )
          .first();
        return Response.json({
          photos: result.photos || 0,
          videos: result.videos || 0,
          total: result.total || 0,
        });
      }
    }