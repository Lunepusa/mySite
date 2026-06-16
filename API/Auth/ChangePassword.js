import {getUser} from "./GetUser.js";
import{hashPassword} from "./Hash.js";

 export async function changePassword(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user) {
        return new  Response("Unauthorized", {
          status: 401,
        });
      }
        
          const { currentPassword, newPassword } = await request.json();
          if (!currentPassword || !newPassword) {
            throw new Error("Missing passwords");
          }
          // Fetch stored hash
          const stmt = db
            .prepare("SELECT password_hash FROM users WHERE id = ?")
            .bind(user.id);
          const result = await stmt.first();
          if (!result) {
            return Response.json({ code: "BAD_INPUT", message: "User not found" }, { status: 404 });
          }
          // Compare current password
          const currentHash = await hashPassword(currentPassword);
          if (result.password_hash !== currentHash) {
            return Response.json({ code: "BAD_INPUT", message: "Current password incorrect" }, { status: 400 });
          }
          // Update with new hash
          const newHash = await hashPassword(newPassword);
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .bind(newHash, user.id)
            .run();
          return Response.json({
            success: true,
          });
        
      }