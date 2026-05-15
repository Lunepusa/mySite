import React from "react";
import "./styles.css";
import Invoice from "./invoice";
import Collapse from "./Utility";
import loungepreview from "./Images/Preview/lounge.jpg";
import dmpreview from "./Images/Preview/dm.jpg";
import headerimg from "./Images/Preview/headerimg.png";
import fepreview from "./Images/Preview/FE.jpg";
import pgfepreview from "./Images/Preview/PGFE.jpg";
import custompicpreview from "./Images/Preview/custompic.jpg";
import customvidpreview from "./Images/Preview/custvid.jpg";
import gfepreview from "./Images/Preview/gfe.jpg";
import meetpreview from "./Images/Preview/Meet.jpg";
import textratepreview from "./Images/Preview/textrate.jpg";
import vidratepreview from "./Images/Preview/vidrate.jpg";
import vidcallpreview from "./Images/Preview/vidcall.png";
import sextpreview from "./Images/Preview/sext.jpg";
import { SpendFromWallet } from "./Utility";
import { useAuth, apiFetch, Login } from "./Auth";

// ──────────────────────────────────────────────────────────────────────────────
// Main Menu page — lists all services, rates, markups/discounts, and invoice form
// ──────────────────────────────────────────────────────────────────────────────
export default function Menu() {
  const { isSubscriber, isLoggedIn, isAdmin, user, walletBalance } = useAuth();

  return (
    <div style={{ textAlign: "center", width: "95%", margin: "auto" }}>
      <h1>Menu</h1>

      {/* Markup / discount explanation section */}
      <div style={{ borderBottom: "2px dashed white" }}>
        <h4 style={{ opacity: ".8" }}>
          Prices listed are subject to change, particularly based on the
          following markups and discounts
        </h4>

        <Collapse
          trigger={
            <h4>📈Exclusive, Rush, Taboo, Jerk ~ 50% markup each📈⏬</h4>
          }
        >
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a markup may apply: </b>
            <br />
            ~ you want the media I make to be only seen by you and never posted
            anywhere else(all calls include this by default)
            <br />
            ~ you want the content to happen sooner then the time I estimated.
            this can be applied multiple times depending on the amount rush(if 1
            estimated 1 week, 3 days may be 50%, meanwhile 1 day may be 100%)
            <br />~ The content is particularly tabboo,{" "}
            <a href="/about#collapse-softlimits">
              is something on my list of soft limits,
            </a>
            or otherwise is more difficult to resell such as name use. <br />~
            you have been a particular jerk, not reading what I have sent you,
            not respecting my stance on things, or just been mean without my
            agreeing to that.
          </p>
        </Collapse>

        <Collapse trigger={<h4>📉Bulk, Easy ~ 25% discount each📉⏬</h4>}>
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a discounts may apply: </b>
            <br />
            ~ You buy a lot of things at once. This can be applied multiple
            times.(all GFE's include this by default)
            <br />~ You are wanting something that is incredibly easy to do or
            make, such as a custom video of me shaking my tits
          </p>
        </Collapse>
      </div>

      {/* Main services list */}
      <div>
        {/* Lounge / Drive access */}
        <Collapse trigger={<h3>🗃️private lounge ~ $10/month 🗃️⏬</h3>}>
          1 month of access to my custom built <a href="/lounge"> media feed</a> that I update with all of my solo content before I post it anywhere
          else.
          <br />
          Yearly ($60) and lifetime ($205) also available.
          <br />{" "}
          {/* Wallet subscription button */}
          <SpendFromWallet
            amountCents={1000}
            itemSlug="lounge-monthly"
            description="Monthly Lounge access"
            buttonText={`Subscribe Monthly with Wallet ($${walletBalance < 10 ? 'Insufficient' : user.subscription_expires > 4542307200 ? "You already have Lifetime Access": '10.00'})`}
            disabled={parseFloat(walletBalance) < 10 || user.subscription_expires > 4542307200}
          />
          <img
            src={loungepreview}
            style={{ maxWidth: "100%", maxHeight: "60vh" }}
          />
        </Collapse>

{/* Custom video */}
        <Collapse trigger={<h3>✉️ Pay-Per-Message ~ $1 per my reply ✉️⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Dont want to commit to a larger price tag, but still want to ask some questions or chat? this is the option for you!
              <br />Extremely casual no media messaging, responding when I have time.
            </p>
            <img src={dmpreview} className="previewimg" />
          </div>
        </Collapse>

        
        {/* Custom photoset */}
        <Collapse trigger={<h3>📸Custom photoset~ $15+📸⏬</h3>}>
          <div>
            <img src={custompicpreview} className="previewimg" />{" "}
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me in a specific pose or a specific outfit? Let me
              show you!
              <br />~ Price is higly dependent on the specifics so please reach
              out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
          </div>
        </Collapse>

        {/* Custom video */}
        <Collapse trigger={<h3>🎬3m Custom Vid~ $20+🎬⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me doing or saying anything specific? Let me show
              you! <br />~ Price is higly dependent on the specifics so please
              reach out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
            <img src={customvidpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Text rating */}
        <Collapse trigger={<h3>🍌 Text Rating ~ $5🍌⏬</h3>}>
          <div>
            <div>
              <img src={textratepreview} className="previewimg" />
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed paragraph rating where I talk about my thoughts on
                your shape and size, what I think it would be fun to do with,
                and a rating out of 10. <br />
              </p>
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest.
            </p>
          </div>
        </Collapse>

        {/* Video rating */}
        <Collapse trigger={<h3>🍆 Video Rating ~ $30🍆⏬</h3>}>
          <div>
            <div>
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed 3+ minute video rating where I talk about my thoughts
                on your shape and size, what I think it would be fun to do with,
                and a rating out of 10. I can be wearing anything you want.
                Including nothing.
                <br />
              </p>
              <img src={vidratepreview} className="previewimg" />
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest
            </p>
          </div>
        </Collapse>

        {/* Sexting session */}
        <Collapse trigger={<h3>💌15m Sexting Session ~ $30+💌⏬</h3>}>
          <div>
            <img src={sextpreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 15 minutes of my dedicated attention chatting and sending live
              media. <br />~ $20 for every additional 15 minutes
            </p>
          </div>
        </Collapse>

        {/* Video call */}
        <Collapse trigger={<h3>📳5m Video Call ~ $55+📳⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 5 minute video call where we talk about or show whatever you
              want. My camera and mic will be on
              <br />~ $25 for every additional 5 minutes
            </p>
            <img src={vidcallpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Friend Experience */}
        <Collapse trigger={<h3>🗨️1 week Friend Experience ~ $25+🗨️ ⏬</h3>}>
          <div>
            <img src={fepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of extremely casual no media texting resonding when I
              have time <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Girlfriend Experience */}
        <Collapse trigger={<h3>💋1 week Girfriend Experience ~ $95+💋⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of no media texting/sexting throughout the day, good
              morning and good night pics <br /> online only
            </p>
            <img src={gfepreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Premium Girlfriend Experience */}
        <Collapse
          trigger={<h3>💍1 week Premium Girlfriend Experience ~ $495+💍⏬</h3>}
        >
          <div>
            <img src={pgfepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of live media texting/sexting throughout the day, up to 2
              hours of customs or calls throughout the week <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Calgary meets */}
        <div>
          <Collapse trigger={<h2> 🛏️Calgary meets🛏️⏬-NOT CURRENTLY AVAILABLE</h2>}>
            Full details listed{" "}
            <a href="https://tryst.link/escort/lunepusa"> here</a>
            <br />
            <div>
              <h4>🏩1hr at my hotel room ~ $500🏩</h4>
              Includes $200 deposit required minimum 3 days prior
              <h4>🏠1hr at your place ~ $400🏠</h4>
              Includes $100 deposit required minimum 12 hours prior
              <h4>⏳Additional hour~ $200⏳</h4>
              <Collapse trigger={<h3>Rules ⏬</h3>}>
                ~ Condoms required for everything <br />
                ~ no same day appointments <br />
                ~ I cannot guarantee availability till deposit is paid. <br />
                ~ markups and discounts above may apply
                <br />~ No Fly Me to You. Calgary only.
              </Collapse>
              <img src={meetpreview} className="previewimg" />
            </div>
          </Collapse>
        </div>
      </div>

      {/* Invoice / quote form */}
      <Collapse trigger={<h2>🧮Invoice form for making quotes🧮⏬</h2>}>
        <Invoice />
      </Collapse>
    </div>
  );
}
dth: "70%",
              }}
            >
              ~ 1 week of extremely casual no media texting resonding when I
              have time <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Girlfriend Experience */}
        <Collapse trigger={<h3>💋1 week Girfriend Experience ~ $95+💋⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of no media texting/sexting throughout the day, good
              morning and good night pics <br /> online only
            </p>
            <img src={gfepreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Premium Girlfriend Experience */}
        <Collapse
          trigger={<h3>💍1 week Premium Girlfriend Experience ~ $495+💍⏬</h3>}
        >
          <div>
            <img src={pgfepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of live media texting/sexting throughout the day, up to 2
              hours of customs or calls throughout the week <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Calgary meets */}
        <div>
          <Collapse trigger={<h2> 🛏️Calgary meets🛏️⏬</h2>}>
            Full details listed{" "}
            <a href="https://tryst.link/escort/lunepusa"> here</a>
            <br />
            <div>
              <h4>🏩1hr at my hotel room ~ $500🏩</h4>
              Includes $200 deposit required minimum 3 days prior
              <h4>🏠1hr at your place ~ $400🏠</h4>
              Includes $100 deposit required minimum 12 hours prior
              <h4>⏳Additional hour~ $200⏳</h4>
              <Collapse trigger={<h3>Rules ⏬</h3>}>
                ~ Condoms required for everything <br />
                ~ no same day appointments <br />
                ~ I cannot guarentee availability till deposit is paid. <br />
                ~ markups and discounts above may apply
                <br />~ No Fly Me to You. Calgary only.
              </Collapse>
              <img src={meetpreview} className="previewimg" />
            </div>
          </Collapse>
        </div>
      </div>

      {/* Invoice / quote form */}
      <Collapse trigger={<h2>🧮Invoice form for making quotes🧮⏬</h2>}>
        <Invoice />
      </Collapse>
    </div>
  );
              }
        <Collapse
          trigger={
            <h4>📈Exclusive, Rush, Taboo, Jerk ~ 50% markup each📈⏬</h4>
          }
        >
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a markup may apply: </b>
            <br />
            ~ you want the media I make to be only seen by you and never posted
            anywhere else(all calls include this by default)
            <br />
            ~ you want the content to happen sooner then the time I estimated.
            this can be applied multiple times depending on the amount rush(if 1
            estimated 1 week, 3 days may be 50%, meanwhile 1 day may be 100%)
            <br />~ The content is particularly tabboo,{" "}
            <a href="/about#collapse-softlimits">
              is something on my list of soft limits,
            </a>
            or otherwise is more difficult to resell such as name use. <br />~
            you have been a particular jerk, not reading what I have sent you,
            not respecting my stance on things, or just been mean without my
            agreeing to that.
          </p>
        </Collapse>

        <Collapse trigger={<h4>📉Bulk, Easy ~ 25% discount each📉⏬</h4>}>
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a discounts may apply: </b>
            <br />
            ~ You buy a lot of things at once. This can be applied multiple
            times.(all GFE's include this by default)
            <br />~ You are wanting something that is incredibly easy to do or
            make, such as a custom video of me shaking my tits
          </p>
        </Collapse>
      </div>

      {/* Main services list */}
      <div>
        {/* Lounge / Drive access */}
        <Collapse trigger={<h3>🗃️private lounge ~ $10/month 🗃️⏬</h3>}>
          1 month of access to my custom built <a href="/lounge"> media feed</a> that I update with all of my solo content before I post it anywhere
          else.
          <br />
          Yearly ($60) and lifetime ($205) also available.
          <br />{" "}
          {/* Wallet subscription button */}
          <SpendFromWallet
            amountCents={1000}
            itemSlug="lounge-monthly"
            description="Monthly Lounge access"
            buttonText={`Subscribe Monthly with Wallet ($${walletBalance < 10 ? 'Insufficient' : user.subscription_expires > 4542307200 ? "You already have Lifetime Access": '10.00'})`}
            disabled={parseFloat(walletBalance) < 10 || user.subscription_expires > 4542307200}
          />
          <img
            src={loungepreview}
            style={{ maxWidth: "100%", maxHeight: "60vh" }}
          />
        </Collapse>

{/* Custom video */}
        <Collapse trigger={<h3>✉️ Pay-Per-Message ~ $1 per my reply ✉️⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Dont want to commit to a larger price tag, but still want to ask some questions or chat? this is the option for you!
              <br />Extremely casual no media messaging, responding when I have time.
            </p>
            <img src={dmpreview} className="previewimg" />
          </div>
        </Collapse>

        
        {/* Custom photoset */}
        <Collapse trigger={<h3>📸Custom photoset~ $15+📸⏬</h3>}>
          <div>
            <img src={custompicpreview} className="previewimg" />{" "}
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me in a specific pose or a specific outfit? Let me
              show you!
              <br />~ Price is higly dependent on the specifics so please reach
              out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
          </div>
        </Collapse>

        {/* Custom video */}
        <Collapse trigger={<h3>🎬3m Custom Vid~ $20+🎬⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me doing or saying anything specific? Let me show
              you! <br />~ Price is higly dependent on the specifics so please
              reach out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
            <img src={customvidpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Text rating */}
        <Collapse trigger={<h3>🍌 Text Rating ~ $5🍌⏬</h3>}>
          <div>
            <div>
              <img src={textratepreview} className="previewimg" />
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed paragraph rating where I talk about my thoughts on
                your shape and size, what I think it would be fun to do with,
                and a rating out of 10. <br />
              </p>
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest.
            </p>
          </div>
        </Collapse>

        {/* Video rating */}
        <Collapse trigger={<h3>🍆 Video Rating ~ $30🍆⏬</h3>}>
          <div>
            <div>
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed 3+ minute video rating where I talk about my thoughts
                on your shape and size, what I think it would be fun to do with,
                and a rating out of 10. I can be wearing anything you want.
                Including nothing.
                <br />
              </p>
              <img src={vidratepreview} className="previewimg" />
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest
            </p>
          </div>
        </Collapse>

        {/* Sexting session */}
        <Collapse trigger={<h3>💌15m Sexting Session ~ $30+💌⏬</h3>}>
          <div>
            <img src={sextpreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 15 minutes of my dedicated attention chatting and sending live
              media. <br />~ $20 for every additional 15 minutes
            </p>
          </div>
        </Collapse>

        {/* Video call */}
        <Collapse trigger={<h3>📳5m Video Call ~ $55+📳⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 5 minute video call where we talk about or show whatever you
              want. My camera and mic will be on
              <br />~ $25 for every additional 5 minutes
            </p>
            <img src={vidcallpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Friend Experience */}
        <Collapse trigger={<h3>🗨️1 week Friend Experience ~ $25+🗨️ ⏬</h3>}>
          <div>
            <img src={fepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of extremely casual no media texting resonding when I
              have time <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Girlfriend Experience */}
        <Collapse trigger={<h3>💋1 week Girfriend Experience ~ $95+💋⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of no media texting/sexting throughout the day, good
              morning and good night pics <br /> online only
            </p>
            <img src={gfepreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Premium Girlfriend Experience */}
        <Collapse
          trigger={<h3>💍1 week Premium Girlfriend Experience ~ $495+💍⏬</h3>}
        >
          <div>
            <img src={pgfepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of live media texting/sexting throughout the day, up to 2
              hours of customs or calls throughout the week <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Calgary meets */}
        <div>
          <Collapse trigger={<h2> 🛏️Calgary meets🛏️⏬-NOT CURRENTLY AVAILABLE</h2>}>
            Full details listed{" "}
            <a href="https://tryst.link/escort/lunepusa"> here</a>
            <br />
            <div>
              <h4>🏩1hr at my hotel room ~ $500🏩</h4>
              Includes $200 deposit required minimum 3 days prior
              <h4>🏠1hr at your place ~ $400🏠</h4>
              Includes $100 deposit required minimum 12 hours prior
              <h4>⏳Additional hour~ $200⏳</h4>
              <Collapse trigger={<h3>Rules ⏬</h3>}>
                ~ Condoms required for everything <br />
                ~ no same day appointments <br />
                ~ I cannot guarantee availability till deposit is paid. <br />
                ~ markups and discounts above may apply
                <br />~ No Fly Me to You. Calgary only.
              </Collapse>
              <img src={meetpreview} className="previewimg" />
            </div>
          </Collapse>
        </div>
      </div>

      {/* Invoice / quote form */}
      <Collapse trigger={<h2>🧮Invoice form for making quotes🧮⏬</h2>}>
        <Invoice />
      </Collapse>
    </div>
  );
}

        <Collapse
          trigger={
            <h4>📈Exclusive, Rush, Taboo, Jerk ~ 50% markup each📈⏬</h4>
          }
        >
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a markup may apply: </b>
            <br />
            ~ you want the media I make to be only seen by you and never posted
            anywhere else(all calls include this by default)
            <br />
            ~ you want the content to happen sooner then the time I estimated.
            this can be applied multiple times depending on the amount rush(if 1
            estimated 1 week, 3 days may be 50%, meanwhile 1 day may be 100%)
            <br />~ The content is particularly tabboo,{" "}
            <a href="/about#collapse-softlimits">
              is something on my list of soft limits,
            </a>
            or otherwise is more difficult to resell such as name use. <br />~
            you have been a particular jerk, not reading what I have sent you,
            not respecting my stance on things, or just been mean without my
            agreeing to that.
          </p>
        </Collapse>

        <Collapse trigger={<h4>📉Bulk, Easy ~ 25% discount each📉⏬</h4>}>
          <p
            style={{
              display: "inline-block",
              width: "80%",
              fontSize: ".8em",
            }}
          >
            <b> Examples for when a discounts may apply: </b>
            <br />
            ~ You buy a lot of things at once. This can be applied multiple
            times.(all GFE's include this by default)
            <br />~ You are wanting something that is incredibly easy to do or
            make, such as a custom video of me shaking my tits
          </p>
        </Collapse>
      </div>

      {/* Main services list */}
      <div>
        {/* Lounge / Drive access */}
        <Collapse trigger={<h3>🗃️private lounge ~ $10/month 🗃️⏬</h3>}>
          1 month of access to my custom built <a href="/lounge"> media feed</a> that I update with all of my solo content before I post it anywhere
          else.
          <br />
          Yearly ($60) and lifetime ($205) also available.
          <br />{" "}
          {/* Wallet subscription button */}
          <SpendFromWallet
            amountCents={1000}
            itemSlug="lounge-monthly"
            description="Monthly Lounge access"
            buttonText={`Subscribe Monthly with Wallet ($${walletBalance < 10 ? 'Insufficient' : user.subscription_expires > 4542307200 ? "You already have Lifetime Access": '10.00'})`}
            disabled={parseFloat(walletBalance) < 10 || user.subscription_expires > 4542307200}
          />
          <img
            src={loungepreview}
            style={{ maxWidth: "100%", maxHeight: "60vh" }}
          />
        </Collapse>

{/* Custom video */}
        <Collapse trigger={<h3>✉️ Pay-Per-Message ~ $1 per my reply ✉️⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Dont want to commit to a larger price tag, but still want to ask some questions or chat? this is the option for you!
              <br />Extremely casual no media messaging, responding when I have time.
            </p>
            <img src={dmpreview} className="previewimg" />
          </div>
        </Collapse>

        
        {/* Custom photoset */}
        <Collapse trigger={<h3>📸Custom photoset~ $15+📸⏬</h3>}>
          <div>
            <img src={custompicpreview} className="previewimg" />{" "}
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me in a specific pose or a specific outfit? Let me
              show you!
              <br />~ Price is higly dependent on the specifics so please reach
              out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
          </div>
        </Collapse>

        {/* Custom video */}
        <Collapse trigger={<h3>🎬3m Custom Vid~ $20+🎬⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ Want to see me doing or saying anything specific? Let me show
              you! <br />~ Price is higly dependent on the specifics so please
              reach out for a{" "}
              <a href="/menu#collapse-invoiceformformakingquotes">quote!</a>
            </p>
            <img src={customvidpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Text rating */}
        <Collapse trigger={<h3>🍌 Text Rating ~ $5🍌⏬</h3>}>
          <div>
            <div>
              <img src={textratepreview} className="previewimg" />
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed paragraph rating where I talk about my thoughts on
                your shape and size, what I think it would be fun to do with,
                and a rating out of 10. <br />
              </p>
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest.
            </p>
          </div>
        </Collapse>

        {/* Video rating */}
        <Collapse trigger={<h3>🍆 Video Rating ~ $30🍆⏬</h3>}>
          <div>
            <div>
              <p
                style={{
                  display: "inline-block",
                  width: "70%",
                }}
              >
                ~ Detailed 3+ minute video rating where I talk about my thoughts
                on your shape and size, what I think it would be fun to do with,
                and a rating out of 10. I can be wearing anything you want.
                Including nothing.
                <br />
              </p>
              <img src={vidratepreview} className="previewimg" />
            </div>
            <p
              style={{
                display: "inline-block",
              }}
            >
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest
            </p>
          </div>
        </Collapse>

        {/* Sexting session */}
        <Collapse trigger={<h3>💌15m Sexting Session ~ $30+💌⏬</h3>}>
          <div>
            <img src={sextpreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 15 minutes of my dedicated attention chatting and sending live
              media. <br />~ $20 for every additional 15 minutes
            </p>
          </div>
        </Collapse>

        {/* Video call */}
        <Collapse trigger={<h3>📳5m Video Call ~ $55+📳⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 5 minute video call where we talk about or show whatever you
              want. My camera and mic will be on
              <br />~ $25 for every additional 5 minutes
            </p>
            <img src={vidcallpreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Friend Experience */}
        <Collapse trigger={<h3>🗨️1 week Friend Experience ~ $25+🗨️ ⏬</h3>}>
          <div>
            <img src={fepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of extremely casual no media texting resonding when I
              have time <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Girlfriend Experience */}
        <Collapse trigger={<h3>💋1 week Girfriend Experience ~ $95+💋⏬</h3>}>
          <div>
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of no media texting/sexting throughout the day, good
              morning and good night pics <br /> online only
            </p>
            <img src={gfepreview} className="previewimg" />
          </div>
        </Collapse>

        {/* Premium Girlfriend Experience */}
        <Collapse
          trigger={<h3>💍1 week Premium Girlfriend Experience ~ $495+💍⏬</h3>}
        >
          <div>
            <img src={pgfepreview} className="previewimg" />
            <p
              style={{
                display: "inline-block",
                width: "70%",
              }}
            >
              ~ 1 week of live media texting/sexting throughout the day, up to 2
              hours of customs or calls throughout the week <br /> online only
            </p>
          </div>
        </Collapse>

        {/* Calgary meets */}
        <Collapse trigger={<h2> 🛏️Calgary meets🛏️⏬-NOT CURRENTLY AVAILABLE</h2>}>
            Full details listed{" "}
            <a href="https://tryst.link/escort/lunepusa"> here</a>
            <br />
            <div>
              <h4>🏩1hr at my hotel room ~ $500🏩</h4>
              Includes $200 deposit required minimum 3 days prior
              <h4>🏠1hr at your place ~ $400🏠</h4>
              Includes $100 deposit required minimum 12 hours prior
              <h4>⏳Additional hour~ $200⏳</h4>
              <Collapse trigger={<h3>Rules ⏬</h3>}>
                ~ Condoms required for everything <br />
                ~ no same day appointments <br />
                ~ I cannot guarentee availability till deposit is paid. <br />
                ~ markups and discounts above may apply
                <br />~ No Fly Me to You. Calgary only.
              </Collapse>
              <img src={meetpreview} className="previewimg" />
            </div>
          </Collapse>
        </div>
      </div>

      {/* Invoice / quote form */}
      <Collapse trigger={<h2>🧮Invoice form for making quotes🧮⏬</h2>}>
        <Invoice />
      </Collapse>
    </div>
  );
}
