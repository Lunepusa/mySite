import Navbar from "./Navbar.jsx";
import Links from "./Links.jsx";
import Menu from "./Menu.jsx";
import About from "./FAQ.jsx";
import Shh from "./shh.jsx";
import WIP from "./WIP.jsx";
import Mailing, { MailingFooter } from "./Mailing.jsx";
import {
  useFirstVisit,
  ConfirmationBox,
  trackEvent,
  getSourceMedium,
  AnalyticsProvider,
  useAnalytics,
} from "./Utility.jsx";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import React, { useEffect } from "react";
import Auth from "./Auth.jsx";
import AuthProvider from "./Auth.jsx";
import { useAuth, apiFetch } from "./Auth";
import Lounge from "./Lounge.jsx";
import Profile from "./Profile.jsx";
import ShareView from "./ShareView.jsx";

const SmartSearchRedirector = () => {
  const location = useLocation();
  const searchQuery = decodeURIComponent(location.pathname.substring(1));
  return <link to={`/Lounge#${searchQuery}`} replace />;
};

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
    <div style={{ backgroundColor: "black", width:"100vw" }}>
      <ConfirmationBox
        isOpen={showConfirmation}
        onAgree={handleAgree}
        onDecline={handleDecline}
      />
      <Navbar />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Links />} />
          <Route path="/links" element={<Links />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/about" element={<About />} />
          <Route path="/FAQ" element={<About />} />
          <Route path="/mailing" element={<Mailing />} />
          <Route path="/Lounge" element={<Lounge />} />
          <Route path="/WIP" element={<WIP />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/share/:token" element={<ShareView />} />
          <Route path="*" element={<SmartSearchRedirector />} />
          <Route path="/shh" element={<Shh />} />
        </Routes>
      </AuthProvider>
      <br />
      <br />
      <div>
        <MailingFooter />
        <div style={{ textAlign: "center", fontSize: ".8em" }}>
          {" "}
          this site is and always will be a work in progress. wanna see a specific feature? let me know!
        </div>
      </div>
    </div>
  );
}
