
import {getUser} from "./GetUser.js";
import {refreshGmailToken} from "./RefreshGmailToken";

 export async function test-gmail-token") {
      
        const token = await refreshGmailToken(env);
        return new  Response(
          `Access token success: ${token.slice(0, 10)}...`,
        );
      } 
    