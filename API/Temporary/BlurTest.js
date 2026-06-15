import {getUser} from "./GetUser.js";

 export async function blurTest(request, env) {return new  Response("Worker is working! Blur route is active.", {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }