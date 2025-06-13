import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { useLocation } from "react-router-dom";
import "./styles.css";

export default function Collapse({ trigger, children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const { analyticsData } = useAnalytics();

  const triggerText =
    typeof trigger === "string" ? trigger : trigger.props.children;
  const id = `collapse-${(triggerText || "content")
    .replace(/\s+/g, "-")
    .replace(
      /[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase()}`;

  useEffect(() => {
    if (location.hash === `#${id}`) {
      setIsCollapsed(false);
    }
  }, [location.hash, id]);

  const toggleCollapse = () => {
    trackOnClick(
      location.search,
      "Navigation",
      `collapsible_trigger_${id}`,
      id,
      analyticsData
    );
    setIsCollapsed(!isCollapsed);
  };

  const handlerightclick = (e) => {
    Copylink(id, location);
  };

  return (
    <div className="collapsible" id={id} onContextMenu={handlerightclick}>
      {React.cloneElement(trigger, {
        className: `collapsible-trigger ${trigger.props.className || ""}`,
        onClick: toggleCollapse,
        role: "button",
        tabIndex: 0,
        "aria-expanded": !isCollapsed,
        "aria-controls": id,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            trackOnClick(
              location.search,
              "Navigation",
              `collapsible_trigger_${id}`,
              id,
              analyticsData
            );
            setIsCollapsed(!isCollapsed);
          }
        },
      })}
      <div
        className={`collapse ${isCollapsed ? "" : "expanded"}`}
        aria-hidden={isCollapsed}
      >
        <div className="collapsible-content">{children}</div>
      </div>
    </div>
  );
}

export function Copylink(id, location) {
  const baseUrl = window.location.origin;
  const path = location.pathname;
  const link = `${baseUrl}${path}#${id}`;
  console.log("Copying: ", link);
  navigator.clipboard
    .writeText(link)
    .catch((err) => console.error("Clipboard error:", err));
}

// Custom hook to detect first visit
export const useFirstVisit = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      setShowConfirmation(true);
      localStorage.removeItem("hasVisited");
    }
  }, []); // Run once on mount
  const location = useLocation();
  const { analyticsData } = useAnalytics();

  const handleAgree = () => {
    localStorage.setItem("hasVisited", "true");
    setShowConfirmation(false);
    trackOnClick(
      location.search,
      "Confirmation",
      "confirm_agree",
      "/agree",
      analyticsData
    );
  };

  const handleDecline = () => {
    localStorage.removeItem("hasVisited");
    setShowConfirmation(false);
    trackOnClick(
      location.search,
      "Confirmation",
      "confirm_decline",
      "/decline",
      analyticsData
    );
    window.location.href = "https://www.coolmathgames.com/"; // Attempt to close the tab/window
  };

  return { showConfirmation, handleAgree, handleDecline };
};

// Confirmation box component
export const ConfirmationBox = ({ isOpen, onAgree, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="fullpopup">
      <div className="popup">
        <h2>Welcome!</h2>
        <p>
          This site has NSFW content and is NOT suitable for anyone under 18
          years old. <br />
          In addition, this site is still a work in progress and may having
          missing information.
        </p>
        <button onClick={onAgree}>
          I am older then 18, and am ok with viewing an incomplete website
        </button>
        <button onClick={onDecline}>
          I am younger then 18, or am not ok with viewing an incomplete website
        </button>
      </div>
    </div>
  );
};

// Send a GA event with optional additional parameters
export const trackEvent = (
  category,
  action,
  label = null,
  value = null,
  additionalParams = {}
) => {
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      custom_source: additionalParams.custom_source || "unknown",
      custom_medium: additionalParams.custom_medium || "unknown",
      destination: additionalParams.destination || "unknown",
      source: additionalParams.source || "unknown",
      medium: additionalParams.medium || "unknown",
      ...additionalParams,
    });
  } else {
    console.warn("Google Analytics not loaded");
  }
};

// Map query parameters to source and medium
export const getSourceMedium = (queryParam) => {
  // Handle special cases
  const mappings = {
    twitterbio: { source: "twitter", medium: "bio" },
    twitterdm: { source: "twitter", medium: "dm" },
    blueskybio: { source: "bluesky", medium: "bio" },
    blueskydm: { source: "bluesky", medium: "dm" },
    discordbio: { source: "discord", medium: "bio" },
    discorddm: { source: "discord", medium: "dm" },
    instagrambio: { source: "instagram", medium: "bio" },
    instagramdm: { source: "instagram", medium: "dm" },
    redditbio: { source: "reddit", medium: "bio" },
    redditdm: { source: "reddit", medium: "dm" },
    beaconsold: { source: "beacons", medium: "old" },
    tiktokbio: { source: "tiktok", medium: "bio" },
    tiktokdm: { source: "tiktok", medium: "dm" },
    me: { source: "personal", medium: "test" },
    twittersd: { source: "twitter", medium: "sugardaddy"},
    twittered: { source: "twitter", medium: "sugardaddy"},
  };

  // Return special case if exists
  if (mappings[queryParam]) {
    return mappings[queryParam];
  }

  // Check for separator (- or _)
  const hasSeparator = queryParam.includes("-") || queryParam.includes("_");
  const separator = queryParam.includes("-") ? "-" : "_";
  const parts = queryParam.split(separator);

  // Handle source-medium format (e.g., twitter-bio)
  if (hasSeparator && parts.length === 2) {
    const [source, medium] = parts;
    if (source && medium) {
      return {
        source: source.toLowerCase(),
        medium: medium.toLowerCase()
      };
    }
  }

  // Handle single source (e.g., twitter)
  if (!hasSeparator && queryParam && queryParam !== "none") {
    return {
      source: queryParam.toLowerCase(),
      medium: "unknown"
    };
  }

  // Fallback for invalid formats
  return { source: "unknown", medium: "unknown" };
};

// Debounce function to prevent duplicate events
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Reusable click tracking function
export const trackOnClick = (
  search,
  category,
  label,
  destination,
  analyticsData = null
) => {
  let source, medium;
  if (search) {
    const searchParams = new URLSearchParams(search);
    const queryParam = searchParams.keys().next().value || "none";
    ({ source, medium } = getSourceMedium(queryParam));
  } else if (analyticsData) {
    ({ source, medium } = analyticsData);
  } else {
    ({ source, medium } = { source: "unknown", medium: "unknown" });
  }

  trackEvent(category, "click", label, null, {
    custom_source: source,
    custom_medium: medium,
    source,
    medium,
    destination,
  });
};

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const [analyticsData, setAnalyticsData] = useState({
    source: "unknown",
    medium: "unknown",
  });

  return (
    <AnalyticsContext.Provider value={{ analyticsData, setAnalyticsData }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => useContext(AnalyticsContext);
