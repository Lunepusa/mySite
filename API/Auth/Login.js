import {hashPassword} from "./Hash.js";
import{generateToken} from "./GenerateToken.js";
import {getUser} from "./GetUser.js";

 export async function login(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const { username, password, mode = "login" } = await request.json();
  console.log("Login attempt:", {
    username,
    mode,
    hasPassword: !!password,
  });

  // 👉Start
  // Flattened the massive nested if/else blocks and converted everything to Response.json()
  if (!username || !password) {
    return Response.json(
      { code: "BAD_INPUT", error: "Missing fields" },
      { status: 400 }
    );
  }

  // --- SIGNUP MODE ---
  if (mode === "signup") {
    const existing = await db
      .prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)")
      .bind(username)
      .first();

    if (existing) {
      return Response.json(
        { code: "BAD_INPUT", error: "Username taken" },
        { status: 409 }
      );
    } 
    
    const passwordHash = await hashPassword(password);
    const result = await db
      .prepare(
        `INSERT INTO users (username, password_hash, is_admin, subscription_expires)
         VALUES (?, ?, 0, 0) RETURNING id`
      )
      .bind(username, passwordHash)
      .first();

    if (!result) {
      return Response.json(
        { code: "UNKNOWN", error: "Create failed" },
        { status: 500 }
      );
    }

    // Set default muted tags for new user
    const defaultMuted =
      "taboo,scat,fart,cnc,dubcon,race_play,bnwo,age play,blackmail fetish,blood,breathplay,hypno,somno,monster_dildo,knotted_dildo,tentacle,werewolf";
      
    await db
      .prepare("UPDATE users SET muted_tags = ? WHERE id = ?")
      .bind(defaultMuted, result.id)
      .run();

    const payload = {
      userId: result.id,
      username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    };
    const token = await generateToken(payload, env);
    
    return Response.json({ success: true, token }, { status: 200 });
  }

  // --- LOGIN MODE ---
  const user = await db
    .prepare("SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?)")
    .bind(username)
    .first();

  console.log("User query result:", user ? "found" : "not found");

  if (user) {
    console.log("Stored hash:", user.password_hash);
    console.log("Computed hash:", await hashPassword(password));
    console.log("Hash match:", user.password_hash === (await hashPassword(password)));
  }

  if (user && user.password_hash === (await hashPassword(password))) {
    const payload = {
      userId: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };
    const token = await generateToken(payload, env);
    
    return Response.json({ success: true, token }, { status: 200 });
  } 
  
  // If it didn't hit the success block above, it fails here
  return Response.json(
    { code: "AUTH_FAILED", error: "Invalid credentials" },
    { status: 401 }
  );
  // 👈 End
}