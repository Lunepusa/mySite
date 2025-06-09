import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import Collapse from "./Utility";
import Fansly from "/public/link/Fansly.jpg";
import Throne from "/public/link/throne.jpg";
import xvids from "/public/link/xvids.jpg";
import tryst from "/public/link/Tryst.jpg";
import Alua from "/public/link/Alua.png";
import AmazonGC from "/public/link/AmazonGC.jpg";
import Amazon from "/public/link/Amazon.jpg";
import Chaturbate from "/public/link/Chaturbate.png";
import Clips4Sale from "/public/link/Clips4Sale.jpg";
import Interac from "/public/link/Interac.jpg";
import IWantClips from "/public/link/IWantClips.jpg";
import Lovense from "/public/link/Lovense.png";
import Loyalfans from "/public/link/LoyalFans.png";
import Mintstars from "/public/link/MintStars.jpg";
import Pornhub from "/public/link/Pornhub.png";
import PremiumChat from "/public/link/PremiumChat.jpg";
import Sheer from "/public/link/Sheer.jpg";
import Skip from "/public/link/Skip.jpg";
import Steam from "/public/link/Steam.jpg";
import Manyvids from "/public/link/Manyvids.png";
import SP from "/public/link/SP.jpg";

export function Link({ name, desc, img, link = "" }) {
  return (
    <div class="link">
      <div class="info">
        +<br />
        <div class="infotext">
          <h2>{name}</h2>
          <h4>{desc}</h4>
        </div>
      </div>
      <a href={link}>
        <img src={img} alt={name} />
      </a>
    </div>
  );
}

export function Preferredlinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      {" "}
      <h1 style={{ textAlign: "center", display: "inline-block" }} class="info">
        {" "}
        Preferred Links
        <div class="infotext">
          <h6>where I like to be</h6>
        </div>
      </h1>
      <h1 style={{ display: "inline-block" }}> + </h1>
      <div id="preferredlinks">
        <Link
          name="Fansly"
          desc="4000+pics &500+vids for $5 a month"
          img={Fansly}
          link="https://fans.ly/r/Lunepusa"
        />
        <Link
          name="Throne"
          desc="Give me a gift"
          img={Throne}
          link="https://throne.com/lunepusa"
        />
        <Link
          name="Tryst"
          desc="Coming to Calgary? lets play~"
          img={tryst}
          link="https://t.ly/RcGCF"
        />
      </div>
    </div>
  );
}

export function Paymentlinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      {" "}
      <Collapse
        trigger={
          <h1
            style={{
              textAlign: "center",
              display: "inline-block",
              border: "2px dashed white",
              width: "100%",
            }}
          >
            All Payment Methods +
          </h1>
        }
      >
        <div id="otherlinks">
          <h2 style={{ opacity: 0.8 }}>
            if its not linked here, then I dont accept funds there
          </h2>
          <Link
            name="Fansly"
            desc="4000+pics &500+vids for $5 a month"
            img={Fansly}
            link="https://fans.ly/r/Lunepusa"
          />
          <Link
            name="Sheer"
            desc="hard fetish friendly platform"
            img={Sheer}
            link="https://www.sheer.com/LunePusa"
          />
          <Link
            name="Manyvids"
            desc=""
            img={Manyvids}
            link="https://lunepusa.manyvids.com"
          />
          <Link
            name="Sext Panther"
            desc=""
            img={SP}
            link="https://www.sextpanther.com/LunePusa/"
          />

          <div style={{ border: "3px dotted white" }}>
            <h2> Gift cards</h2>
            <h3 style={{ opacity: ".8" }}>
              {" "}
              send to{" "}
              <u
                onClick={() => {
                  navigator.clipboard.writeText("lunepusa@gmail.com");
                  alert("Copied the text: Lunepusa@gmail.com");
                }}
              >
                Lunepusa@gmail.com
              </u>
            </h3>
            <Link
              name="Skip the Dishes"
              desc="food delivery"
              img={Skip}
              link="https://skipthedishes.cashstar.com/store/recipient?locale=en-ca"
            />
            <Link
              name="Steam"
              desc="Video Games"
              img={Steam}
              link="https://store.steampowered.com/digitalgiftcards/selectgiftcard"
            />
            <Link
              name="Interac E-transfer"
              desc="Canadian bank to bank transfer"
              img={Interac}
              link="https://www.interac.ca/en/consumers/products/interac-e-transfer/"
            />
            <Link
              name="Amazon Giftcard"
              desc="Canadian"
              img={AmazonGC}
              link="https://www.amazon.ca/Amazon-ca-Gift-Card-Birthday-Cupcakes/dp/B07TRWGYDH/ref=sr_1_1?hvadid=667066139172&hvdev=c&hvlocphy=9001320&hvnetw=g&hvqmt=e&hvrand=15786390872409873519&hvtargid=kwd-594341209899&hydadcr=23336_13656849&keywords=amazon.ca+gift+card&qid=1702489076&sr=8-1"
            />
          </div>
          <div style={{ border: "3px dotted white" }}>
            <h2> Wishlists</h2>
            <h3 style={{ opacity: ".8" }}>
              Not accepted as payment without discussion. <br />
              <i> No content/services till items physically arrive </i>{" "}
            </h3>
            <Link
              name="Amazon Wishlist"
              desc="appreciated, but not considered payment"
              img={Amazon}
              link="https://www.amazon.ca/hz/wishlist/ls/2CFSD9EF206V?ref_=wl_share"
            />
            <Link
              name="Lovense Wishlist"
              desc=""
              img={Lovense}
              link="https://www.lovense.com/wish-list/9pk8"
            />
            <Link
              name="Throne"
              desc="Give me a gift"
              img={Throne}
              link="https://fans.ly/r/Lunepusa"
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export function Otherlinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      <Collapse
        trigger={
          <h1
            style={{
              textAlign: "center",
              display: "inline-block",
              border: "2px dashed white",
              width: "100%",
            }}
          >
            Other accounts I have +
          </h1>
        }
      >
        <div id="otherlinks">
          <h2 style={{ opacity: 0.8 }}>
            All other accounts I have, but cant guarentee I use in any capacity.
          </h2>
          <Link
            name="Chaturbate"
            desc=""
            img={Chaturbate}
            link="https://chaturbate.com/in/?tour=dT8X&campaign=pV7Y7&track=default&room=lunepusa"
          />
          <Link
            name="Loyalfans"
            desc=""
            img={Loyalfans}
            link="https://www.loyalfans.com/lunepusa"
          />
          <Link
            name="MintStars"
            desc=""
            img={Mintstars}
            link="https://app.mintstars.com/LunePusa"
          />
          <Link name="Alua" desc="" img={Alua} link="alua.com/lunepusa" />
          <Link
            name="Premium.Chat"
            desc=""
            img={PremiumChat}
            link="https://premium.chat/LunePusa"
          />

          <Link
            name="Clips4Sale"
            desc=""
            img={Clips4Sale}
            link="https://www.clips4sale.com/studio/247631/lunepusa"
          />

          <div style={{ border: "3px dotted white" }}>
            <h2>Social media</h2>
            <h3 style={{ opacity: ".8" }}>
              I rarely chat one on one here without a tip{" "}
            </h3>
            <Link
              name="Xvideos"
              desc="Free videos"
              img={xvids}
              link="https://www.xvideos.com/models/lunepusa-model"
            />
            <Link
              name="Pornhub"
              desc="Free videos"
              img={Pornhub}
              link="https://www.pornhub.com/model/Lunepusa"
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
}
export function Sociallinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      <Collapse
        trigger={
          <h1
            style={{
              textAlign: "center",
              display: "inline-block",
              border: "2px dashed white",
              width: "100%",
            }}
          >
            Social Media +
          </h1>
        }
      >
        <div id="otherlinks">
          <h2 style={{ opacity: 0.8 }}>
            Social media / free accounts. I rarely chat one on one here without
            extra motivation
          </h2>
          <Link
            name="Chaturbate"
            desc=""
            img={Chaturbate}
            link="https://chaturbate.com/in/?tour=dT8X&campaign=pV7Y7&track=default&room=lunepusa"
          />
          <Link
            name="Loyalfans"
            desc=""
            img={Loyalfans}
            link="https://www.loyalfans.com/lunepusa"
          />
          <Link
            name="MintStars"
            desc=""
            img={Mintstars}
            link="https://app.mintstars.com/LunePusa"
          />
          <Link name="Alua" desc="" img={Alua} link="alua.com/lunepusa" />
          <Link
            name="Premium.Chat"
            desc=""
            img={PremiumChat}
            link="https://premium.chat/LunePusa"
          />
          <Link
            name="Amazon Wishlist"
            desc="appreciated, but not considered payment"
            img={Amazon}
            link="https://www.amazon.ca/hz/wishlist/ls/2CFSD9EF206V?ref_=wl_share"
          />
          <Link
            name="Lovense Wishlist"
            desc=""
            img={Lovense}
            link="https://www.lovense.com/wish-list/9pk8"
          />
          <Link
            name="Clips4Sale"
            desc=""
            img={Clips4Sale}
            link="https://www.clips4sale.com/studio/247631/lunepusa"
          />
          <Link
            name="Xvideos"
            desc="Free videos"
            img={xvids}
            link="https://www.xvideos.com/models/lunepusa-model"
          />
          <Link
            name="Pornhub"
            desc="Free videos"
            img={Pornhub}
            link="https://www.pornhub.com/model/Lunepusa"
          />
        </div>
      </Collapse>
    </div>
  );
}
export function Guestlinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      <Collapse
        trigger={
          <h1
            style={{
              textAlign: "center",
              display: "inline-block",
              border: "2px dashed white",
              width: "100%",
            }}
          >
            Places I guest star +
          </h1>
        }
      >
        <div id="guestlinks">
          <h2 style={{ opacity: 0.8 }}>
            Accounts I join for content! if you want to see me not solo, this is
            where.
          </h2>
          <div style={{ border: "3px dotted white" }}>
            <h3> Katya_Luv </h3>
            <Link
              name="Fansly"
              desc="$5 optional sub"
              img={Fansly}
              link="https://fans.ly/r/Katya_Luv"
            />
            <Link
              name="Xvideos"
              desc="Free videos"
              img={xvids}
              link="https://www.xvideos.com/models/katyaluv-model"
            />
            <Link
              name="Pornhub"
              desc="4000+pics &500+vids for $5 a month"
              img={Pornhub}
              link="https://www.pornhub.com/model/katyaluv27"
            />
          </div>
          <div style={{ border: "3px dotted white" }}>
            <h3> LilytheElfgirl </h3>
            <Link
              name="Fansly"
              desc="$5 optional sub"
              img={Fansly}
              link="https://fans.ly/r/LilytheElfgirl"
            />

            <Link
              name="Lily's Pornhub"
              desc="Give me a gift"
              img={Pornhub}
              link="https://www.pornhub.com/model/lily-the-elf-girl"
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
}
export default function Links() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      {" "}
      <Preferredlinks />
      <Paymentlinks />
      <Otherlinks />
      <Sociallinks />
      <Guestlinks />
    </div>
  );
}
