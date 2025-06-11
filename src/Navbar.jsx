import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { reactDOM } from "react-dom";
import "./styles.css";
import { Link } from "react-router-dom";
import headerimg from "./Images/Preview/headerimg.png";

function navbar() {
  return (
    <div
      style={{
        width: "100%",
        borderBottom: "2px solid white",
        textAlign: "left",
        alignContent: "left",
      }}
    >
      <div
        class="navbar"
        style={{
          maxWidth: "90%",
          margin: "auto",
          backgroundImage: `url(${headerimg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "right top",
          textAlign: "left",
        }}
      >
        <br />
        <ul
          style={{
            listStyleType: "none",
            width: "fit-content",
            height: "fit-content",
            padding: "0px",
            textAlign: "left",
            margin: "0px",
          }}
        >
          <li>
            <Link to="/">Links</Link>
          </li>
          <li>
            <Link to="/menu">Menu</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
        <br />
        <p
          style={{
            textAlign: "left",
            fontSize: "2em",
            display: "inline-block",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            LunePusa
          </Link>
        </p>
        <br />
        <br />
      </div>
    </div>
  );
}
export default navbar;
