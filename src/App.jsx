import Navbar from "./Navbar.jsx";
import Links from "./Links.jsx";
import Menu from "./Menu.jsx";
import About from "./FAQ.jsx";
import Shh from "./shh.jsx";
import {
  useFirstVisit,
  ConfirmationBox,
  trackEvent,
  getSourceMedium,
  AnalyticsProvider,
  useAnalytics,
} from "./Utility.jsx";
import { Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";

export default function App() {
  const location = useLocation();
  const { setAnalyticsData } = useAnalytics();
  const { analyticsData } = useAnalytics();
  const { showConfirmation, handleAgree, handleDecline } = useFirstVisit();

  // GA4 Tracking useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.keys().next().value || "none";
    const { source: querySource, medium: queryMedium } =
      getSourceMedium(queryParam);

    // Use query if available, else context
    const source = queryParam !== "none" ? querySource : analyticsData.source;
    const medium = queryParam !== "none" ? queryMedium : analyticsData.medium;

    if (queryParam !== "none") {
      setAnalyticsData({ source: querySource, medium: queryMedium });
    }

    const destination = location.pathname || "/";
    const referrer = document.referrer || "direct";

    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search,
        page_referrer: referrer,
        custom_source: source,
        custom_medium: medium,
        source,
        medium,
        destination,
      });
    } else {
      console.error("GA not loaded, check script or ad blockers");
    }
  }, [location, analyticsData, setAnalyticsData]);

  // Hash Scrolling useEffect
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          element.setAttribute("tabindex", "-1");
          element.focus({ focusVisible: true });
        }, 500);
      }
    }
  }, [location]);

  return (
    <div style={{ backgroundColor: "black" }}>
      <ConfirmationBox
        isOpen={showConfirmation}
        onAgree={handleAgree}
        onDecline={handleDecline}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Links />} />
        <Route path="/links" element={<Links />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/about" element={<About />} />
        <Route path="/FAQ" element={<About />} />
        <Route path="*" element={<h1>404 - Page not found</h1>} />
        <Route path="/shh" element={<Shh />} />
      </Routes>
    </div>
  );
}
