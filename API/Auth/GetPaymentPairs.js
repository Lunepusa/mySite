import {getUser} from "./GetUser.js";

 export async function getPaymentPairs(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
 if (!user) {
    return Response.json({ code: "AUTH_FAILED" }, { status: 401 });
  }

  // 👉Start
  // Flattened remaining code against the left margin
  let pairs = [];
  if (
    user.saved_payment_pairs &&
    user.saved_payment_pairs.trim() !== "[]"
  ) {
    try {
      pairs = JSON.parse(user.saved_payment_pairs);
    } catch (e) {
      console.error("Invalid saved_payment_pairs JSON:", e);
      pairs = [];
    }
  }

  return Response.json({
    pairs,
  });
  // 👈 End
}