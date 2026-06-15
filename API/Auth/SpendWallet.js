import {getUser} from "./GetUser.js";

 export async function spendWallet(request, env) {
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
          const {
            amountCents,
            itemSlug,
            description = "Purchase",
          } = await request.json();
          if (!amountCents || amountCents <= 0 || !itemSlug) {
            return Response.json(
              {
                error: "Missing or invalid amount/item",
              },
              {
                status: 400,
              },
            );
          } else {
            let walletData = {
              balance: 0,
            };
            if (user.wallet && user.wallet.trim() !== "[]") {
              try {
                walletData = JSON.parse(user.wallet);
              } catch (e) {
                console.error("Invalid wallet JSON:", e);
              }
            }

            const currentBalance = walletData.balance || 0;

            if (currentBalance < amountCents) {
              return Response.json({
                success: false,
                message: `Insufficient balance. You have $${(currentBalance / 100).toFixed(2)} available.`,
              });
            } else {
              // Deduct from wallet
              walletData.balance = currentBalance - amountCents;

              // Determine days to add based on itemSlug
              let daysToAdd = 0;
              if (itemSlug === "lounge-monthly") {
                daysToAdd = 31;
              } else if (itemSlug === "lounge-yearly") {
                daysToAdd = 365;
              } else if (itemSlug === "lounge-lifetime") {
                daysToAdd = 32850;
              }

              let newExpiry = 0;
              if (daysToAdd > 0) {
                const now = Math.floor(Date.now() / 1000);
                const currentExpiry = user.subscription_expires || 0;
                const baseTime = currentExpiry > now ? currentExpiry : now;
                newExpiry = baseTime + daysToAdd * 24 * 3600;
              }

              await db
                .prepare(
                  "UPDATE users SET wallet = ?, subscription_expires = ? WHERE id = ?",
                )
                .bind(
                  JSON.stringify(walletData),
                  newExpiry || user.subscription_expires, // preserve old if no extension
                  user.id,
                )
                .run();

              // Log to purchases
              await db
                .prepare(
                  "INSERT INTO purchases (user_id, item_slug, amount_cents, description, purchased_at) VALUES (?, ?, ?, ?, ?)",
                )
                .bind(
                  user.id,
                  itemSlug,
                  amountCents,
                  description,
                  new Date().toISOString(),
                )
                .run();

              return Response.json({
                success: true,
                message:
                  `$${(amountCents / 100).toFixed(2)} spent. new balance: $${(walletData.balance / 100).toFixed(2)}.` +
                  (daysToAdd > 0
                    ? ` Subscription extended by ${daysToAdd} days.`
                    : ""),
              });
            }
          }
        }
      }
    }