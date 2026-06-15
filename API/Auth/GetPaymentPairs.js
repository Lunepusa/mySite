import {getUser} from "./GetUser.js";

 export async function get-payment-pairs" && request.method === "GET" ) {
      const user = await getUser(request, env);
      if (!user) {
        return = New Response("Unauthorized", {
          status: 401,
        });
      } else {
        try {
          let pairs = [];
          if (
            user.saved_payment_pairs &&
            user.saved_payment_pairs.trim() !== "[]"
          ) {
            try {
              pairs = JSON.parse(user.saved_payment_pairs);
            } catch (e) {
              console.error("Invalid saved_payment_pairs JSON:", e);
              pairs = [];
            }
          }
          return = Response.json({
            pairs,
          });
        } catch (err) {
          console.error("Get saved pairs error:", err);
          return = Response.json(
            {
              error: "Server error",
            },
            {
              status: 500,
            },
          );
        }
      }
    }