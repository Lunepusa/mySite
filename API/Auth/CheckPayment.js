import {getUser} from "./GetUser.js";
import {refreshGmailToken} from "./RefreshGmailToken";

 export async function checkPayment(request, env) {
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
          } else { const accessToken = await refreshGmailToken(env);

            // Lookup senders for this platform
            const platRow = await db
              .prepare("SELECT senders FROM platforms WHERE platform = ?")
              .bind(platform)
              .first();

            const senders = platRow ? JSON.parse(platRow.senders || "[]") : [];

            let fromClause = "";
            if (senders.length > 0) {
              fromClause = senders.map((s) => `from:${s}`).join(" OR ");
            } else {
              const domain =
                platform.toLowerCase().replace(/\s+/g, "") + ".com";
              fromClause = `from:@${domain}`;
            }

            // Last 7 days only
            const daysBack = 7;
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - daysBack);
            const sinceStr = sinceDate.toISOString().split("T")[0];

            const query = `${fromClause} "${username}" after:${sinceStr}`;

            const listRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );
            const listData = await listRes.json();

            if (!listData.messages || listData.messages.length === 0) {
              return Response.json({
                success: false,
                message: "No matching emails found in the last 7 days.",
              });
            } else {
              let foundPayments = 0;
              let totalAddedCents = 0;
              let processedIds = [];

              for (const msg of listData.messages) {
                const msgRes = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                );
                const msgData = await msgRes.json();

                const labels = msgData.labelIds || [];

                // Exclude if already claimed or Non-Payment
                if (
                  labels.includes("Label_1909551957303359400") ||
                  labels.includes("Label_2723636466645469159")
                ) {
                  continue;
                }

                // Extract text body
                let bodyText = "";
                const payload = msgData.payload;
                if (payload.parts) {
                  const textPart = payload.parts.find(
                    (p) => p.mimeType === "text/plain",
                  );
                  if (textPart && textPart.body && textPart.body.data) {
                    bodyText = atob(
                      textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"),
                    );
                  }
                } else if (payload.body && payload.body.data) {
                  bodyText = atob(
                    payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
                  );
                }

                // Special handling for "Direct from LunePusa"
                if (platform === "Direct from LunePusa") {
                  const dateHeader = payload.headers.find(
                    (h) => h.name === "Date",
                  )?.value;
                  if (!dateHeader) continue;

                  const sendDate = new Date(dateHeader);
                  if (isNaN(sendDate.getTime())) continue;

                  const mtDate = sendDate.toLocaleString("en-US", {
                    timeZone: "America/Denver",
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  });

                  const [month, day, year] = mtDate.split("/");
                  const creditCode = `CREDIT${month}${day}${year}`;

                  if (!bodyText.includes(creditCode)) {
                    continue;
                  }
                }

                // Find non-zero dollar amount
                const dollarRegex =
                  /\$[1-9]\d*(\.\d{1,2})?|USD\s*[1-9]\d*(\.\d{1,2})?/gi;
                const matches = bodyText.match(dollarRegex);
                if (!matches) continue;

                let paymentCents = 0;
                for (const match of matches) {
                  const dollars = parseFloat(match.replace(/\$|USD\s*/gi, ""));
                  if (dollars > 0) {
                    paymentCents = Math.round(dollars * 100);
                    break;
                  }
                }
                if (paymentCents === 0) continue;

                // Process payment
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
                walletData.balance = (walletData.balance || 0) + paymentCents;

                await db
                  .prepare("UPDATE users SET wallet = ? WHERE id = ?")
                  .bind(JSON.stringify(walletData), user.id)
                  .run();

                await db
                  .prepare(
                    "INSERT INTO claimed_payments (user_id, username, platform, gmail_message_id, amount_cents, claimed_at) VALUES (?, ?, ?, ?, ?, ?)",
                  )
                  .bind(
                    user.id,
                    username,
                    platform,
                    msg.id,
                    paymentCents,
                    Math.floor(Date.now() / 1000),
                  )
                  .run();

                // Apply "claimed" label using correct ID
                await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      addLabelIds: ["Label_1909551957303359400"],
                    }),
                  },
                );

                foundPayments++;
                totalAddedCents += paymentCents;
                processedIds.push(msg.id);
              }

              return Response.json({
                success: foundPayments > 0,
                message:
                  foundPayments > 0
                    ? `Found ${foundPayments} payment(s) totaling $${(totalAddedCents / 100).toFixed(2)} – added to wallet!`
                    : "No valid recent payments found (last 7 days). Contact LunePusa for older payments.",
                processedIds,
              });
            }
          }
        } 
      }
    }