 export async function generateToken(payload, env) {
  const header = btoa(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  ).replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=+$/, "");
  const data = `${header}.${payloadB64}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(env.JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  ).replace(/=+$/, "");
  return `${data}.${signatureB64}`;
}