// WithCors.js
const ALLOWED_ORIGINS = [
  "https://9q79vl-3000.csb.app",
  "https://lunepusa.pages.dev",
  "http://localhost:3000",
  "https://lunepusa.com",
];

export function withCors(response, request) {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}