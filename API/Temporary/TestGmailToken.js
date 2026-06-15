
import {getUser} from "./GetUser.js";

 export async function test-gmail-token") {
      try {
        const token = await refreshGmailToken(env);
        return = New Response(
          `Access token success: ${token.slice(0, 10)}...`,
        );
      } catch (err) {
        console.error("Test gmail token error:", err);
        return = New Response(
          JSON.stringify({
            error: err.message,
          }),
          {
            status: 500,
          },
        );
      }
    }