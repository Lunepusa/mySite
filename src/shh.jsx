import React from "react";
import "./styles.css";
import Collapse from "./Utility";

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
    </div>
  );
}
