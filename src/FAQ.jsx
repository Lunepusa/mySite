import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import Collapse from "./Utility";

export default function About() {
  return (
    <div style={{ textAlign: "center", width: "95%", margin: "auto" }}>
      <h1>a bit about me!</h1>
      <h4>
        ~24 aromantic pansexual canadian
        <br />
        ~ Kink/fetish friendly(fav kinks and hard limits listed below) <br />
        ~ Switch(Pleasure domme & Pet sub are my favorites)
        <br />
        ~ Dating and make content with LilytheElfGirl and Katya_Luv
        <br />
        Porn descriptions of me: girl next door, natural, and big boobs (10+
        inch difference in bust to underbust), Hentai milf (I have the body of a
        milf, closest I have to a kid is my cat)
        <br />I am chronically inconsistent and go MIA often. It almost never
        has anything to do with you, I am not quitting Sex work, and I am ok.
      </h4>
      <Collapse trigger={<h1>Loves and Limits</h1>}>
        <h3 style={{ opacity: ".8" }}>
          These are not complete lists! if it isnt mentioned: ASK
        </h3>
        <Collapse trigger={<h2>SFW loves</h2>}>
          <div style={{ columnCount: "3", columnFill: "balance-all" }}>
            Animals
            <br /> Spreadsheets
            <br /> Google suite
            <br /> Troubleshooting
            <br /> Making
            <br />
            Coding
            <br /> Sewing
            <br /> Book binding
            <br /> Dancing
            <br /> Singing
            <br /> Watching YouTube
            <br />
            <br />
            Video games(survival, farming, life sim, and visual novel are my
            favorite genres, bonus points to a porn game in these genres)
          </div>
        </Collapse>
        <Collapse trigger={<h2>NSFW loves</h2>}>
          <div style={{ columnCount: "3", columnFill: "balance-all" }}>
            Pet play
            <br /> deep throating
            <br /> begging
            <br /> teasing
            <br /> overstim
            <br /> edging
            <br /> lingerie
            <br /> sex toys
            <br /> heels
            <br /> hentai/animated porn
            <br /> audio porn
            <br /> furries
          </div>
        </Collapse>
        <Collapse trigger={<h2>Soft Limits</h2>}>
          <h3 style={{ opacity: ".8" }}>
            {" "}
            These are things I may be willing to do, but will likely upcharge
            for and CANNOT disscuss it on official adult platforms. 
          </h3>
          <div style={{ columnCount: "3", columnFill: "balance-all" }}>
            Cnc rp
            <br /> blackmail rp
            <br /> choking/breath play
            <br /> drinking piss
            <br /> scat discussions or into toilet
            <br /> menstrual blood
            <br /> fake blood
            <br /> incest rp
            <br /> age play rp
            <br />
            light race play(BBC/BNWO)
            <br />
            religion play
            <br /> low risk public play
            <br /> light sadism/masochism(no bruising or further)
          </div>
        </Collapse>
        <Collapse trigger={<h2>Hard Limits</h2>}>
          <h3 style={{ opacity: ".8" }}>These are things I will not do ever</h3>
          <div style={{ columnCount: "3", columnFill: "balance-all" }}>
            Anything illegal or that I will get in trouble for <br />
            vomit
            <br /> anything more then discussions or directly into toilet scat{" "}
            <br />
            heavy sadism or masochism
            <br /> tickle torture
            <br /> high risk public content
            <br />
          </div>
        </Collapse>
      </Collapse>
      <Collapse trigger={<h1>What is my CashApp? PayPal? Bank? Ect?</h1>}>
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
        TLDR: I dont have one to give you
      </Collapse>
      <Collapse trigger={<h1>Do I need a cock to collab with?</h1>}>
        I am currently not interested in having non solo content on any of my
        pages, however I would be open to collaborating on your accounts if you
        pay for my escorting fees and follow my escorting rules.
        <br />~ TLDR: No I dont.
      </Collapse>
    </div>
  );
}
