import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import Collapse from "./Utility";

export default function Shh() {
  return (
    <div style={{ textAlign: "center", width: "95%", margin: "auto" }}>
      <h1>Secret page for my own personal use. You shouldnt know about this</h1>
      <Collapse trigger={<h2>Link tracking</h2>}>
        <h3>
          automatic layout is lunepusa.onrender.com/?source-medium <br />
          hardcoded versions are <br />
          twitterbio twitterdm blueskybio blueskydm discordbio discorddm
          instagrambio instagramdm redditbio redditdm beaconsold tiktokbio
          tiktokdm me twittersd twittered
        </h3>
      </Collapse>
    </div>
  );
}
