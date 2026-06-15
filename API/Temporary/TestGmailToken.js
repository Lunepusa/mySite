
import {getUser} from "./GetUser.js";
import {refreshGmailToken} from "./RefreshGmailToken";

 export async function test-gmail-token") {
      try {
        const token = await refreshGmailToken(env);
        return New  Response(
          `Access token success: ${token.slice(0, 10)}...`,
        );
      } 
    }