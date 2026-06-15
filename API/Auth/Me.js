import {getUser} from "./GetUser.js";


 export async function 
import {getUser} from "./GetUser.js";

 export async function me") {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
      const user = await getUser(request, env);
      return Response.json({
        user: user || null,
      });
    };