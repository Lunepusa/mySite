import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import { useLocation } from "react-router-dom";
import { trackOnClick, useAnalytics, handlerightclick } from "./Utility";
import Collapse from "./Utility";
import Fansly from "./Images/link/Fansly.jpg";
import Throne from "./Images/link/throne.jpg";
import xvids from "./Images/link/xvids.jpg";
import tryst from "./Images/link/Tryst.jpg";
import Alua from "./Images/link/Alua.png";
import AmazonGC from "./Images/link/AmazonGC.jpg";
import Amazon from "./Images/link/Amazon.jpg";
import Chaturbate from "./Images/link/Chaturbate.png";
import Clips4Sale from "./Images/link/Clips4Sale.jpg";
import Interac from "./Images/link/Interac.jpg";
import IWantClips from "./Images/link/IWantClips.jpg";
import Lovense from "./Images/link/Lovense.png";
import Loyalfans from "./Images/link/LoyalFans.png";
import Mintstars from "./Images/link/MintStars.jpg";
import Pornhub from "./Images/link/Pornhub.png";
import PremiumChat from "./Images/link/PremiumChat.jpg";
import Sheer from "./Images/link/Sheer.jpg";
import Skip from "./Images/link/Skip.jpg";
import Steam from "./Images/link/Steam.jpg";
import Manyvids from "./Images/link/Manyvids.png";
import SP from "./Images/link/SP.jpg";
import Messenger from "./Images/link/messenger.png";
import Reddit from "./Images/link/Reddit.png";
import Signal from "./Images/link/Signal.png";
import Bluesky from "./Images/link/bluesky.png";
import Tumblr from "./Images/link/Tumblr.png";
import Snapchat from "./Images/link/Snapchat.png";
import Telegram from "./Images/link/telegram.png";
import Text from "./Images/link/Text.png";
import TikTok from "./Images/link/TikTok.png";
import Twitter from "./Images/link/Twt.png";
import Discord from "./Images/link/Discord.png";
import Email from "./Images/link/email.png";
import Hangout from "./Images/link/hangout.png";
import Instagram from "./Images/link/Instagram.png";

export function Link({ name, desc, img, link = "" }) {
  const location = useLocation();
  const { analyticsData } = useAnalytics();
  const id = `link-${(name || "link")
    .replace(/\s+/g, "-")
    .replace(
      /[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase()}`;

  const handleLinkClick = () => {
    trackOnClick(location.search, "Social", id, link, analyticsData);
  };

  return (
    <div className="link" onContextMenu={() => handlerightclick(id, location)}>
      <div className="info">
        +<br />
        <div className="infotext">
          <h2>{name}</h2>
          <h4>{desc}</h4>
        </div>
      </div>
      <a href={link} onClick={handleLinkClick}>
        <img src={img} alt={name} />
      </a>
    </div>
  );
}

export function Preferredlinks() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      {" "}
      <h1
        style={{ textAlign: "center", display: "inline-block" }}
        className="info"
      >
        {" "}
        Preferred Links
        <div className="infotext">
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
        <div id="freelinks">
          <h2 style={{ opacity: 0.8 }}>
            Social media / free accounts. I rarely chat one on one here without
            $$
          </h2>
          <Link
            name="Xvideos"
            desc=""
            img={xvids}
            link="https://www.xvideos.com/models/lunepusa-model"
          />
          <Link
            name="Pornhub"
            desc=""
            img={Pornhub}
            link="https://www.pornhub.com/model/Lunepusa"
          />
          <Link
            name="Twitter"
            desc=""
            img={Twitter}
            link="https://x.com/LunePusa"
          />
          <Link
            name="Tumblr"
            desc=""
            img={Tumblr}
            link="https://www.tumblr.com/blog/lunepusa"
          />
          <Link
            name="Bluesky"
            desc=""
            img={Bluesky}
            link="https://bsky.app/profile/lunepusa.bsky.social"
          />
          <Link
            name="TikTok"
            desc=""
            img={TikTok}
            link="https://www.tiktok.com/@lunepusa?_t=ZG-8x7XFczrjmb&_r=1"
          />
          <Link
            name="Instagram"
            desc=""
            img={Instagram}
            link="https://www.instagram.com/mooncatlune?igsh=MThveDVqNjh2NjRkZw=="
          />
          <Link
            name="Reddit"
            desc=""
            img={Reddit}
            link="https://www.reddit.com/u/LunePusa/s/Zf0SLuahbd"
          />
          <div style={{ border: "3px dotted white" }}>
            <h2>Instant Messaging</h2>
            <h3 style={{ opacity: ".8" }}>Good places for paid services.</h3>
            <Link
              name="Discord"
              desc=""
              img={Discord}
              link="http://discordapp.com/users/191206268181020673"
            />
            <Link
              name="Telegram"
              desc=""
              img={Telegram}
              link="https://t.me/lunepusa3"
            />
            <Link
              name="Signal"
              desc=""
              img={Signal}
              link="https://signal.me/#eu/M3ns7Y0dvg8DS_5CzkuiOLaxECQMz40bZsmh27Df6qgUE1aWHdFFPq9GE1lT2cGv"
            />
            <Link
              name="Email"
              desc=""
              img={Email}
              link="mailto:lunepusa@gmail.com"
            />
            <Link name="SMS" desc="" img={Text} link="sms:+15878480806" />
            <Link
              name="Snapchat"
              desc=""
              img={Snapchat}
              link="https://www.snapchat.com/add/lunepusa?share_id=qeZVVUXrswY&locale=en-US-u-mu-celsius"
            />
          </div>
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
