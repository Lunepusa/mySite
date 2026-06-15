import { AwsClient } from "aws4fetch";


// Auth
import { changePassword } from "./Auth/ChangePassword.js";
import { checkPayment } from "./Auth/CheckPayment.js";
import { generateToken } from "./Auth/GenerateToken.js"; // 🛠️ Helper
import { getPaymentPairs } from "./Auth/GetPaymentPairs.js"; //add to getUser
import { getUser } from "./Auth/GetUser.js";
import { getUsers } from "./Auth/GetUsers.js";
import { hashPassword } from "./Auth/Hash.js"; // 🛠️ Helper
import { login } from "./Auth/Login.js";
import { logout } from "./Auth/Logout.js";
import { me } from "./Auth/Me.js";
import { refreshGmailToken } from "./Auth/RefreshGmailToken.js"; // 🛠️ Helper
import { savePaymentPair } from "./Auth/SavePaymentPair.js";
import { spendWallet } from "./Auth/SpendWallet.js";
import { tagPrefs } from "./Auth/TagPrefs.js"; //add to getUser
import { updateUser } from "./Auth/UpdateUser.js";
import { validateToken } from "./Auth/ValidateToken.js"; // 🛠️ Helper
import { withCors } from "./Auth/WithCors.js"; // 🛠️ Helper

// Media
import { bulkUpdate } from "./Media/BulkUpdate.js";
import { galleryStats } from "./Media/GalleryStats.js";
import { generateShareToken } from "./Media/GenerateShareToken.js";
import { getTagsArray } from "./Media/GetTagsArray.js"; // 🛠️ Helper
import {getTagsArray} from "./Media/GetTagsArray.js";
import { media } from "./Media/Media.js";
import { presign } from "./Media/Presign.js";
import { purgeDelete } from "./Media/PurgeDelete.js";
import { share } from "./Media/Share.js"; // Dynamic route
import { tagStats } from "./Media/TagStats.js";
import { uploadBatch } from "./Media/UploadBatch.js";
import { uploadComplete } from "./Media/UploadComplete.js";

// Root
import { platforms } from "./Platforms.js";

// Temporary
import { blurTest } from "./Temporary/BlurTest.js";
import { flattenR2 } from "./Temporary/FlattenR2.js";
import { getFiles } from "./Temporary/GetFiles.js";
import { testGmailToken } from "./Temporary/TestGmailToken.js";


// --- The Static Route Dictionary ---
// This handles all exact-match URLs instantly.
// Alphabetical by Function Name
const staticRoutes = {

  '/blur-test': blurTest,
  '/bulk-update': bulkUpdate,
  '/change-password': changePassword,
  '/check-payment': checkPayment,
  '/gallery-stats': galleryStats,
  '/generate-share-token': generateShareToken,
  '/get-files': getFiles,
  '/get-payment-pairs': getPaymentPairs,
  '/get-users': getUsers,
  '/login': login,
  '/logout': logout,
  '/me': me,
  '/media': media,
  '/migrate-flatten-r2': flattenR2,
  '/platforms': platforms,
  '/presign': presign,
  '/purge-delete': purgeDelete,
  '/save-payment-pair': savePaymentPair,
  '/spend-wallet': spendWallet,
  '/tag-prefs': tagPrefs,
  '/tag-stats': tagStats,
  '/test-gmail-token': testGmailToken,
    '/admin-update-user': updateUser,
  '/upload-batch': uploadBatch,
  '/upload-complete': uploadComplete
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request);
    }

    try {
      let response;
      const handler = staticRoutes[url.pathname];

      if (handler) {
        response = await handler(request, env);
      } 
      else if (url.pathname.startsWith('/share/')) {
        response = await Share(request, env);
      } 
      else {
        response = new Response("Not found", { status: 404 });
      }

      return withCors(response, request);

    }catch (error) {
      console.error("[GLOBAL WORKER ERROR]:", error);
      let currentUsername = 'anonymous';
      const authHeader = request.headers.get("Authorization");
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const payload = await validateToken(token, env);
        if (payload && payload.username) {
          currentUsername = payload.username.toLowerCase();
        }
      }
      const errorCode = error.code || 'UNKNOWN';
      const rawDetails = currentUsername === 'lunepusa' 
        ? { message: error.message, stack: error.stack, route: url.pathname } 
        : null;

      const payload = {
        code: errorCode,
        debug: rawDetails
      };
      const errorResponse = Response.json(payload, { status: error.status || 500 });
      return withCors(errorResponse, request);
    }
  },
};
