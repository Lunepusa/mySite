import Navbar from "./Navbar.jsx";
import Links from "./Links.jsx";
import Menu from "./Menu.jsx";
import About from "./FAQ.jsx";
import { useFirstVisit, ConfirmationBox } from "./Utility.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";

export default function Square() {
  const location = useLocation();
  const { showConfirmation, handleAgree, handleDecline } = useFirstVisit();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          // Optional: Add focus for accessibility
          element.setAttribute("tabindex", "-1");
          element.focus({ focusVisible: true });
        }, 500);
      }
    }
  }, [location]); // Run on route or hash change
  const handleCopyLink = () => {
    alert("Link copied to clipboard!"); // Replace with a toast if desired
  };
  return (
    <div style={{ backgroundColor: "black" }}>
        <ConfirmationBox
        isOpen={showConfirmation}
        onAgree={handleAgree}
        onDecline={handleDecline}
      />
      <Navbar />
      <Routes>
        <Route exact path="/" element={<Links />} />
        <Route path="/links" element={<Links />} />
        <Route exact path="" element={<Links />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/FAQ" element={<About />} />
        <Route path="*" element={<h1>404 - Page not found </h1>} />
      </Routes>
    </div>
  );
}
