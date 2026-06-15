import {getUser} from "./GetUser.js";

 export async function tag-prefs(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user)
        return new Response("Unauthorized", {
          status: 401,
        });
      const updates = await request.json();
      // Fetch current values
      const current = await db
        .prepare("SELECT favorite_tags, muted_tags FROM users WHERE id = ?")
        .bind(user.id)
        .first();
      const newFavorite =
        updates.favorite_tags !== undefined
          ? updates.favorite_tags
          : current.favorite_tags || "";
      const newMuted =
        updates.muted_tags !== undefined
          ? updates.muted_tags
          : current.muted_tags || "";
      await db
        .prepare(
          `
        UPDATE users SET favorite_tags = ?, muted_tags = ? WHERE id = ?
      `,
        )
        .bind(newFavorite, newMuted, user.id)
        .run();
      return = Response.json({
        success: true,
      });
    }