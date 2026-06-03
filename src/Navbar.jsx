import React, { useState } from "react";
import "./styles.css";
import { Link } from "react-router-dom";
import headerimg from "./Images/Preview/headerimg.png";


function Navbar() {
  return (
    <div
      style={{
        width: "100vw",
        borderBottom: "2px solid white",
        textAlign: "left",
      }}
    >
      <div
        className="navbar"
        style={{
          maxWidth: "100%",
          margin: "auto",
          backgroundImage: `url(${headerimg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "right top",
          textAlign: "left",
          width: "100%",
          height:"fit-content",
        }} 
      ><div style={{textAlign: "left",
        display:"inline-block",
        marginTop:"2vh",
        width:"fit-content",

      }}>
                <h1
          style={{
            textAlign: "left",
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
             width:"fit-content",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", padding:"0", margin:"0",display:"block",  width:"fit-content", textAlign:"left"}}>
            LunePusa's Lewd Lounge
          </Link>
        </h1>
        <h2 className="h3">
        <ul
          style={{
            listStyleType: "none",
            width: "fit-content",
            padding: "0px",
            textAlign: "left",
            margin: "0px",
            display:"block",
          }}
        >
           <li>
            <Link to="/Lounge">Private Lounge</Link>
          </li>
          <li>
            <Link to="/">Links</Link>
          </li>
          <li>
            <Link to="/menu">Menu</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>

          <li>
            <Link to="/Profile">Profile</Link>
          </li>
        </ul>
        </h2>
        </div>
      </div>
    </div>
  );
}
export default Navbar;
