import { AwsClient } from "aws4fetch";


// Auth
import { AdminUpdateUser } from "./Auth/AdminUpdateUser.js";
import { ChangePassword } from "./Auth/ChangePassword.js";
import { CheckPayment } from "./Auth/CheckPayment.js";
import { generateToken } from "./Auth/GenerateToken.js"; // 🛠️ Helper
import { GetPaymentPairs } from "./Auth/GetPaymentPairs.js"; //add to getUser
import { GetUsers } from "./Auth/GetUsers.js";
import { hashPassword } from "./Auth/HashPassword.js"; // 🛠️ Helper
import { Login } from "./Auth/Login.js";
import { Logout } from "./Auth/Logout.js";
import { Me } from "./Auth/Me.js";
import { refreshGmailToken } from "./Auth/RefreshGmailToken.js"; // 🛠️ Helper
import { SavePaymentPair } from "./Auth/SavePaymentPair.js";
import { SpendWallet } from "./Auth/SpendWallet.js";
import { TagPrefs } from "./Auth/TagPrefs.js"; //add to getUser
import { validateToken } from "./Auth/ValidateToken.js"; // 🛠️ Helper
import { withCors } from "./Auth/WithCors.js"; // 🛠️ Helper

// Media
import { BulkUpdate } from "./Media/BulkUpdate.js";
import { GalleryStats } from "./Media/GalleryStats.js";
import { GenerateShareToken } from "./Media/GenerateShareToken.js";
import { getTagsArray } from "./Media/GetTagsArray.js"; // 🛠️ Helper
import { Media } from "./Media/Media.js";
import { Presign } from "./Media/Presign.js";
import { PurgeDelete } from "./Media/PurgeDelete.js";
import { Share } from "./Media/Share.js"; // Dynamic route
import { TagStats } from "./Media/TagStats.js";
import { UploadBatch } from "./Media/UploadBatch.js";
import { UploadComplete } from "./Media/UploadComplete.js";

// Root
import { Platforms } from "./Platforms.js";

// Temporary
import { BlurTest } from "./Temporary/BlurTest.js";
import { FlattenR2 } from "./Temporary/FlattenR2.js";
import { GetFiles } from "./Temporary/GetFiles.js";
import { MigrateFlattenR2 } from "./Temporary/MigrateFlattenR2.js";
import { TestGmailToken } from "./Temporary/TestGmailToken.js";


// --- The Static Route Dictionary ---
// This handles all exact-match URLs instantly.
// Alphabetical by Function Name
const staticRoutes = {
  '/admin-update-user': AdminUpdateUser,
  '/blur-test': BlurTest,
  '/bulk-update': BulkUpdate,
  '/change-password': ChangePassword,
  '/check-payment': CheckPayment,
  '/gallery-stats': GalleryStats,
  '/generate-share-token': GenerateShareToken,
  '/get-files': GetFiles,
  '/get-payment-pairs': GetPaymentPairs,
  '/get-users': GetUsers,
  '/login': Login,
  '/logout': Logout,
  '/me': Me,
  '/media': Media,
  '/migrate-flatten-r2': MigrateFlattenR2,
  '/platforms': Platforms,
  '/presign': Presign,
  '/purge-delete': PurgeDelete,
  '/save-payment-pair': SavePaymentPair,
  '/spend-wallet': SpendWallet,
  '/tag-prefs': TagPrefs,
  '/tag-stats': TagStats,
  '/test-gmail-token': TestGmailToken,
  '/upload-batch': UploadBatch,
  '/upload-complete': UploadComplete
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
