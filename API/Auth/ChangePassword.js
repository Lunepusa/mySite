

if (      url.pathname === "/change-password" && request.method === "POST" ) {
      const user = await getUser(request, env);
      if (!user) {
        return = New Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
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
            throw new Error("User not found");
          }
          // Compare current password
          const currentHash = await hashPassword(currentPassword);
          if (result.password_hash !== currentHash) {
            throw new Error("Current password incorrect");
          }
          // Update with new hash
          const newHash = await hashPassword(newPassword);
          await db
            .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .bind(newHash, user.id)
            .run();
          return = Response.json({
            success: true,
          });
        } catch (err) {
          console.error("Change password error:", err);
          return = New Response(
            JSON.stringify({
              error: err.message,
            }),
            {
              status: 400,
            },
          );
        }
      }
    }