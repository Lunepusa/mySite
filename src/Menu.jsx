import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import Collapse from "./Utility";
import Picdrive from "/public/Preview/PicDrive.png";
import Viddrive from "/public/Preview/vidDrive.png";
import headerimg from "/public/Preview/headerimg.png";

export default function Menu() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      <h1>Menu</h1>
      <div style={{ borderBottom: "2px dashed white" }}>
        {" "}
        <h4 style={{ opacity: ".8" }}>
          Prices listed are subject to change, particularly based on the
          following markups and discounts
        </h4>
        <Collapse
          trigger={<h4>📈Exclusive, Rush, Taboo, Jerk ~ 50% markup each📈+</h4>}
        >
          {" "}
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
            <br />
            ~ The content is particularly tabboo or is something on my list of
            soft limits. Things such as ageplay, incest rp, CNC, or scat. <br />
            ~ you have been a particular jerk, not reading what I have sent you,
            not respecting my stance on things, or just been mean without my
            agreeing to that.
          </p>
        </Collapse>
        <Collapse trigger={<h4>📉Bulk, Easy ~ 25% discount each📉+</h4>}>
          {" "}
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
      <div>
        <Collapse trigger={<h3>🖼️6,400+ Pic drive ~ $100 🖼️+</h3>}>
          Permanant access to a google drive that I update with all pictures I
          take of myself.
          <img src={Picdrive} style={{ width: "100vw" }} />
        </Collapse>
        <Collapse trigger={<h3>📼700+ vid drive ~ $100 📼+</h3>}>
          Permanant access to a google drive that I update with all videos I
          take of myself.
          <img src={Viddrive} style={{ width: "100vw" }} />
        </Collapse>
        <Collapse trigger={<h3>📸Custom photoset~ $15+📸+</h3>}>
          <div>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />{" "}
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ Want to see me in a specific pose or a specific outfit? Let me
              show you!
              <br />~ Price is higly dependent on the specifics so please reach
              out for a <u style={{ margin: "0" }}>quote!</u>
            </p>
          </div>
        </Collapse>
        <Collapse trigger={<h3>🎬3m Custom Vid~ $20+🎬+</h3>}>
          {" "}
          <div>
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ Want to see me doing or saying anything specific? Let me show
              you! <br />~ Price is higly dependent on the specifics so please
              reach out for a <u style={{ margin: "0" }}>quote!</u>
            </p>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
          </div>
        </Collapse>
        <Collapse trigger={<h3>🍌 Text Rating ~ $5🍌+</h3>}>
          {" "}
          <div>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ Detailed paragraph rating where I talk about my thoughts on your
              shape and size, what I think it would be fun to do with, and a
              rating out of 10. <br />
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest.
            </p>
          </div>
        </Collapse>
        <Collapse trigger={<h3>🍆 Video Rating ~ $30🍆+</h3>}>
          {" "}
          <div>
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ Detailed 3+ minute video rating where I talk about my thoughts
              on your shape and size, what I think it would be fun to do with,
              and a rating out of 10. I can be wearing anything you want.
              Including nothing.
              <br />
              ~ You can send any number of pictures and videos. Do not send
              until after I tell you to so I can get my first reaction.
              <br />~ Let me know if you want me to be more complimentary or
              mean rather then purely honest.
            </p>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
          </div>
        </Collapse>
        <Collapse trigger={<h3>💌15m Sexting Session ~ $30+💌+</h3>}>
          {" "}
          <div>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ 15 minutes of my dedicated attention chatting and sending live
              media. <br />~ $20 for every additional 15 minutes
            </p>
          </div>
        </Collapse>
        <Collapse trigger={<h3>📳5m Video Call ~ $55+📳+</h3>}>
          {" "}
          <div>
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ 5 minute video call where we talk about or show whatever you
              want. My camera and mic will be on
              <br />~ $25 for every additional 5 minutes
            </p>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
          </div>
        </Collapse>
        <Collapse trigger={<h3>💋1 week GFE ~ $100+💋+</h3>}>
          {" "}
          <div>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ 1 week of no media texting/sexting throughout the day, good
              morning and good night pics
            </p>
          </div>
        </Collapse>
        <Collapse trigger={<h3>💍1 week True GFE ~ $600💍+</h3>}>
          {" "}
          <div>
            <p
              style={{
                display: "inline-block",
                width: "80%",
              }}
            >
              ~ 1 week of live media texting/sexting throughout the day, free
              content/customs all week, some amount of calls
            </p>
            <img
              src={headerimg}
              style={{
                width: "15%",
                display: "inline-block",
                verticleAlign: "middle",
              }}
            />
          </div>
        </Collapse>
        <div>
          <Collapse trigger={<h2> 🛏️Calgary meets🛏️+</h2>}>
            Full details listed{" "}
            <a href="https://tryst.link/escort/lunepusa"> here</a>
            <Collapse trigger={<h3>Rules +</h3>}>
              ~ Condoms required for everything <br />
              ~ no same day appointments <br />
              ~ I cannot guarentee availability till deposit is paid. <br />
              ~ markups and discounts above may apply
              <br />~ No Fly Me to You. Calgary only.
            </Collapse>
            <h4>🏩1hr at my hotel room ~ $500🏩</h4>
            Includes $200 deposit required minimum 3 days prior
            <h4>🏠1hr at your place ~ $400🏠</h4>
            Includes $100 deposit required minimum 12 hours prior
            <h4>⏳Additional hour~ $200⏳</h4>
          </Collapse>
        </div>
      </div>
    </div>
  );
}
export function Quote() {
  return (
    <div style={{ textAlign: "center", width: "100%", margin: "auto" }}>
      <h1>About</h1>
    </div>
  );
}
