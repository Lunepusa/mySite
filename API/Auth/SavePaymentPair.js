import {getUser} from "./GetUser.js";

 export async function savePaymentPair(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      if (!user) {
        return new  Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          const { platform, username } = await request.json();
          if (!platform || !username) {
            return Response.json(
              {
                error: "Missing platform or username",
              },
              {
                status: 400,
              },
            );
          } else {
            // Safely get current pairs
            let pairs = [];
            const rawPairs = user.saved_payment_pairs;
            if (
              rawPairs &&
              rawPairs.trim() !== "" &&
              rawPairs.trim() !== "null" &&
              rawPairs.trim() !== "[]"
            ) {
              try {
                pairs = JSON.parse(rawPairs);
              } catch (parseErr) {
                console.error(
                  "Invalid JSON in saved_payment_pairs:",
                  parseErr,
                  rawPairs,
                );
                pairs = []; // reset to empty on parse failure
              }
            }

            const newPair = {
              platform: platform.trim(),
              username: username.trim(),
            };

            const exists = pairs.some(
              (p) =>
                p.platform === newPair.platform &&
                p.username === newPair.username,
            );

            if (exists) {
              return Response.json({
                success: true,
                message: "Pair already saved",
                pairs,
              });
            } else {
              pairs.push(newPair);
              await db
                .prepare(
                  "UPDATE users SET saved_payment_pairs = ? WHERE id = ?",
                )
                .bind(JSON.stringify(pairs), user.id)
                .run();

              return Response.json({
                success: true,
                message: "Payment pair saved successfully",
                pairs,
              });
            }
          }
        }
      }
    }