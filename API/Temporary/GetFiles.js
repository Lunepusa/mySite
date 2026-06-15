import {getUser} from "./GetUser.js";

 export async function getFiles(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      return = Response.json({
        R2_PUBLIC_URL: env.R2_PUBLIC_URL || "https://files.lunepusa.com",
      });}
      if (!response) {
        return New  Response("Not Found", { status: 404 });
      }