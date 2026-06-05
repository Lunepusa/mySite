import React, { StrictMode, usememo } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import Collapse from "./Utility";
import { LocalTimeSchedule } from "./Utility";

export function LoveandLimits() {
  return (
    <div style={{display:"block"}}>
      <Collapse trigger={<h2>Loves and Limits ⏬</h2>}>
        <h3 style={{}}>
          These are not complete lists! if it isnt mentioned: ASK
        </h3>
        <Collapse trigger={<h3>SFW loves ⏬</h3>}>
          <p style={{}}>
            Animals
            ,  Spreadsheets
            ,  Google suite
            ,  Troubleshooting
            ,  Making
            ,  Coding
            ,  Sewing
            ,  Book binding
            ,  Dancing
            ,  Singing
            ,  Watching YouTube
            , 
            Video games(survival, farming, life sim, and visual novel are my
            favorite genres, bonus points to a porn game in these genres)
          </p>
        </Collapse>
        <Collapse trigger={<h3>NSFW loves ⏬</h3>}>
          <p style={{}}>
            Pet play
            ,  deep throating
            ,  begging
            ,  teasing
            ,  overstim
            ,  edging
            ,  lingerie
            ,  sex toys
            ,  heels
            ,  hentai/animated porn
            ,  audio porn
            ,  furries
          </p>
        </Collapse>
        <Collapse trigger={<h3>Soft Limits ⏬</h3>}>
          <h3 style={{}}>
            These are things I may be willing to do, but will likely upcharge
            for and CANNOT disscuss it on official adult platforms.
          </h3>
          <p style={{}}>
            Cnc rp
            ,  blackmail rp
            ,  choking/breath play
            ,  drinking piss
            ,  menstrual blood
            ,  fake blood
            ,  incest rp
            ,  age play rp
            , 
            light race play(BBC/BNWO)
            , 
            religion play
            ,  low risk public play
            ,  light sadism/masochism(no bruising or further)
          </p>
        </Collapse>
        <Collapse trigger={<h3>Hard Limits ⏬</h3>}>
          <h3 style={{}} className="notice">These are things I will not do ever</h3>
          <p style={{}}>
            Anything illegal or that I will get in trouble for , 
            vomit
            ,  tickle torture
            ,  
            heavy sadism or masochism
            , 
            high risk public content
            , 
            most scat
            , 
          </p>
        </Collapse>
      </Collapse>
    </div>
  );
}
export function Availability() {
  return (
    <div style={{display:"block"}}>
      <Collapse trigger={<h2>Availability ⏬</h2>}>
        <h3 style={{ opacity: ".8" }}>
          When I tend to be available. no guarentee without discussion.
          <br />
          Sexting, Calls, and Meets MUST be scheduled in advance. Customs require time to make.
          <br />
          Please tell me the timezone when scheduling. I am in mountain time.
        </h3>

        <LocalTimeSchedule
        schedules={{
          Mon: ["6:00 PM - 11:00 PM"],
          Tues: ["6:00 PM - 11:00 PM"],
          Wed: ["6:00 PM - 11:00 PM"],
          Thur: ["6:00 PM - 11:00 PM"],
          Fri: ["6:00 PM - 2:00 AM"],
          Sat: ["11:00 AM - 2:00 AM"],
          Sun: ["11:00 AM - 11:00 PM"],
        }}
        descriptions={{
          Mon: "",
          Tues: "",
          Wed: "",
          Thur: "",
          Fri: "",
          Sat: "",
          Sun: "",
        }}
        format="time"
      />
      </Collapse>
    </div>
  );
}

export function Cashapp() {
  return (
    <div style={{display:"block"}}>
      <Collapse trigger={<h2>What is my CashApp or PayPal? ⏬</h2>}><p>
        Cashapp, venmo, apple pay, and other simmilar platforms are not a thing
        in Canada so I cannot use them.
        <br />
        Paypal is extremly anti sex work and will shut down my account if I used
        it for this.
        <br />
        I cant deposit non canadian checks, but if you have a canadian bank then
        you can use Etransfer so there is no reason for me to accept a check.
        <br />
        <h3>
          IF YOU DONT HAVE ONE OF MY ALREADY LINKED METHODS THEN YOU CAN NOT PAY
          ME{" "}
        </h3>
        <h6>
          If you cant accept that, then I dont care to interact with someone who
          has so little respect for me and what I say
        </h6>
        TLDR: I dont use anything not
        <a href="/#collapse-allpaymentmethods"> already linked</a></p>
      </Collapse>
    </div>
  );
}
export function Collab() {
  return (
    <div style={{display:"block"}}>
      <Collapse trigger={<h2>Collabs?⏬</h2>}><p>
        I am currently not interested in having non solo content on any of my
        pages, however below is what I require to guest star on your profiles.
        <br />~ You will be required to pay my escorting rates, however you
        will get full rights to the content we create together and get to
        monetize it however you want and keep all earnings.
        <br />
        ~ Properly tag or credit me <br />
        ~ You have to come to Calgary, AB Canada
        <br />
        ~ Condoms are required for everything</p>
      </Collapse>
    </div>
  );
}
export default function About() {
  return (
    <div style={{ textAlign: "center", display:"block", margin: "auto" }}>
      <h2>A Bit About Me!</h2>
      <h4>
        ~25 aromantic pansexual canadian
        <br />
        ~ Kink/fetish friendly(fav kinks and hard limits listed below) <br />
        ~ Switch(Pleasure domme & Pet sub are my favorites)
        <br />
        ~ Dating and make content with LilytheElfGirl and Katya_Luv
        <br />
        ~ Porn descriptions of me: girl next door, natural, and big boobs (10+
        inch difference in bust to underbust), Hentai milf (I have the body of a
        milf, but have no kids :p)
        <br />
        ~I am chronically inconsistent and go MIA often. It almost never has
        anything to do with you, I am not quitting Sex work, and I am ok.
      </h4>
      <LoveandLimits />
      <Cashapp />
      <Collab />
    </div>
  );
}

