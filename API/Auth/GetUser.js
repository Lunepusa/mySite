import {validateToken} from "./ValidateToken.js";

export async function getUser(request, env) {
  const bucket = env.Media;
  const bucketName = "lunepusa";
  const db = env.Db;
  const kv = env.kv;
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await validateToken(token, env);
  if (!payload) return null;

  return await db
    .prepare(
      "SELECT id, username, is_admin, subscription_expires, favorite_tags, muted_tags, purchased_dates, saved_payment_pairs, wallet FROM users WHERE id = ?",
    )
    .bind(payload.userId)
    .first();
};