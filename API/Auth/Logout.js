
import {getUser} from "./GetUser.js";

 export async function logout(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      return new  Response(
        JSON.stringify({
          success: true,
        }),
        {
          status: 200,
        },
      );
    } 