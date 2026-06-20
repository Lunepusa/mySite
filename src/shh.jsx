import React from "react";
import "./styles.css";
import Collapse from "src/Utility/Utility.jsx";
import PaymentChecker from "src/Profile/profile"

export default function Shh() {
  return (
    <div style={{ textAlign: "center", width: "95%", margin: "auto" }}>
      <h1>Secret page for my own personal use. You shouldnt know about this</h1>
      <Collapse trigger={<h2>Link tracking⏬</h2>}>
        <h3>
          automatic layout is lunepusa.onrender.com/?source-medium <br />
          hardcoded versions are <br />
          twitterbio twitterdm blueskybio blueskydm discordbio discorddm
          instagrambio instagramdm redditbio redditdm beaconsold tiktokbio
          tiktokdm me twittersd twittered
        </h3>
      </Collapse>
      <h3>
        <a href="https://script.google.com/macros/s/AKfycby78mQotIfpl66GkOGw3DDwyTSba9PDPjc6NyhYXiUhyWPgzfkWd4OFVRh0S1KX6bDV/exec">
          {" "}
          Google apps script HTML
        </a>
        <br />
        <a href="https://script.google.com/home/projects/10w_oWlqqKqZarE0oUNs2viDGebkD4HRxlFvOc1GcsZb_k7YZLnr6fLdk/edit">
          {" "}
          Google apps script file
        </a>
      </h3>
<PaymentChecker />
How to Use spendfromwallet (Examples)
1. Basic use (like your Link component)
<SpendFromWallet
  amountCents={1000}           // $10.00
  itemSlug="lounge-subscription"
  description="Monthly Lounge access"
  buttonText="Subscribe with Wallet ($10)"
/>
2. With custom button content (like Collapse's trigger flexibility)
<SpendFromWallet
  amountCents={500}
  itemSlug="custom-content-unlock"
  description="Unlock exclusive video"
>
  Unlock for $5 (Wallet)
</SpendFromWallet>
3. With callbacks (e.g. show toast, refresh page)
<SpendFromWallet
  amountCents={2000}
  itemSlug="premium-tip"
  description="Tip creator"
  onSuccess={() => {
    alert("Tip sent!");
    window.location.reload(); // or refresh some state
  }}
  onError={(msg) => alert(`Failed: ${msg}`)}
/>
4. Disabled or styled
<SpendFromWallet
  amountCents={1500}
  itemSlug="gift-sub"
  description="Gift subscription"
  disabled={true} // force disable
  style={{ background: "#ff6600" }}
/>
    </div>
  );
}
