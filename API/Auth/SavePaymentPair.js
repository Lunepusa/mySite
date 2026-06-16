import {getUser} from "./GetUser.js";

 export async function savePaymentPair(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
 if (!user) {
    return Response.json({ code: "AUTH_FAILED" }, { status: 401 });
  }

  const { platform, username } = await request.json();

  // 👉Start
  // Removed 'else' blocks to flatten the logic
  if (!platform || !username) {
    return Response.json(
      { code: "BAD_INPUT", error: "Missing platform or username" },
      { status: 400 }
    );
  }

  // Safely get current pairs
  let pairs = [];
  const rawPairs = user.saved_payment_pairs;
  // 👈 End
  
  if (
    rawPairs &&
    rawPairs.trim() !== "" &&
    rawPairs.trim() !== "null" &&
    rawPairs.trim() !== "[]"
  ) {
    // NOTE: Keep this try/catch! It prevents the server from crashing if DB data is corrupted.
    try {
      pairs = JSON.parse(rawPairs);
    } catch (parseErr) {
      console.error("Invalid JSON in saved_payment_pairs:", parseErr, rawPairs);
      pairs = []; 
    }
  }

  const newPair = {
    platform: platform.trim(),
    username: username.trim(),
  };

  const exists = pairs.some(
    (p) => p.platform === newPair.platform && p.username === newPair.username,
  );

  // 👉Start
  // Removed final 'else' wrapper
  if (exists) {
    return Response.json({
      success: true,
      message: "Pair already saved",
      pairs,
    });
  }

  pairs.push(newPair);
  await db
    .prepare("UPDATE users SET saved_payment_pairs = ? WHERE id = ?")
    .bind(JSON.stringify(pairs), user.id)
    .run();

  return Response.json({
    success: true,
    message: "Payment pair saved successfully",
    pairs,
  });
  // 👈 End
}