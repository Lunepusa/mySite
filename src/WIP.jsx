import React from "react";
import "./styles.css";
import Collapse from "./Utility";

export default function WIP() {
  return (
    <div style={{ textAlign: "left", width: "95%", margin: "auto" }}>
      <h1>Things I am intending to work on, hopefully in order of priority</h1>{" "}
      <br /> <br />
      <ol type="1">
        <li>faster uploading</li>
        <br />
        <li>uploader is tagged automatically</li>
        <br />
        <li>payment checking</li>
        <br />
        <li>auto subscribe and unsubscribe</li>
        <br />
        <li>media searching</li>
        <br />
        <ol>
          <li>tag muting</li>
          <br />
        </ol>
        <li>profiles</li>
        <br />
        <ol>
          <li>other platform username lists</li>
          <br />
          <li>muted tags list</li>
          <br />
          <li>favorite tags list</li>
          <br />
        </ol>
        <li>gift subscription links</li>
        <br />
        <li>automatic rewards for specific activities</li>
        <br />
        <li>
          tag suggestions with rewards after a specific quantity of approved
          tags
        </li>{" "}
        <br />
        <li>games</li> <br />
        <ol>
          <li>jumbo cactpot</li> <br />
          <li>wheel spin</li> <br />
        </ol>
      </ol>
    </div>
  );
}
