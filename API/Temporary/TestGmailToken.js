
import {getUser} from "../Auth/GetUser.js";
import {refreshGmailToken} from "../Auth/RefreshGmailToken";

 export async function testGmailToken") {
      
        const token = await refreshGmailToken(env);
        return new  Response(
          `Access token success: ${token.slice(0, 10)}...`,
        );
      } 
    