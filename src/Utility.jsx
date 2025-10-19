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

  return (
    <div
      className="collapsible"
      id={id}
      onContextMenu={(e) => handlerightclick(id, location, e)}
    >
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

export const handlerightclick = (id, location, event) => {
  if (id) {
    event.stopPropagation(); // Stop bubbling for elements with an ID
    Copylink(id, location);
  }
  Copylink(id, location);
};
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
    twittersd: { source: "twitter", medium: "sugardaddy" },
    twittered: { source: "twitter", medium: "sugardaddy" },
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
        medium: medium.toLowerCase(),
      };
    }
  }

  // Handle single source (e.g., twitter)
  if (!hasSeparator && queryParam && queryParam !== "none") {
    return {
      source: queryParam.toLowerCase(),
      medium: "unknown",
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

import { useMemo } from "react";

// Helper function to determine if a date is in DST (MDT) for Mountain Time
function isDST(date) {
  var year = date.getFullYear();
  var dstStart = new Date(year, 2, 14 - (new Date(year, 2, 1).getDay() || 7));
  var dstEnd = new Date(year, 10, 7 - (new Date(year, 10, 1).getDay() || 7));
  return date >= dstStart && date < dstEnd;
}

// Helper function to convert MDT time to local time (utility function, not a hook)
export function convertMdtToLocalTime(
  mstTime,
  date = new Date().toISOString().split("T")[0],
  format = "time"
) {
  var formatOptionsMap = {
    time: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "shortGeneric",
    },
    date: { weekday: "short", month: "short", day: "2-digit", year: "numeric" },
    datetime: {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "shortGeneric",
    },
  };

  try {
    var inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) throw new Error("Invalid date");
    var timeZoneAbbr = isDST(inputDate) ? "MDT" : "MST";
    var mstDateTimeStr = `${date} ${mstTime} ${timeZoneAbbr}`;
    var mstDate = new Date(mstDateTimeStr);
    if (isNaN(mstDate.getTime())) throw new Error("Invalid time");
    var formatter = new Intl.DateTimeFormat("en-US", {
      ...formatOptionsMap[format],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    var result = formatter.format(mstDate);
    if (format === "datetime") {
      var parts = result.split(", ");
      result = `${parts[0]} - ${parts[1]}`;
    }
    return result;
  } catch (error) {
    console.error("Error converting time:", error);
    return "Invalid time";
  }
}

// Helper function to determine if a time is within a range
function isWithinRange(time, startHour, endHour) {
  var hour = time.getHours();
  if (endHour < startHour) {
    return (hour >= startHour && hour < 24) || (hour >= 0 && hour < endHour);
  }
  return hour >= startHour && hour < endHour;
}

// Convert time range from MDT to local time (utility function)
function convertTimeRange(range, baseDate) {
  var [startStr, endStr] = range
    .split(" - ")
    .map((s) => s.trim().toLowerCase());
  var endBaseDate = baseDate;
  var endHour = parseInt(endStr.split(/[\s:]+/)[0]);
  var endMeridiem = endStr.split(/[\s:]+/).slice(-1)[0];
  var isOvernight = endMeridiem === "am" && endHour >= 0 && endHour < 7;
  if (isOvernight) {
    endBaseDate = new Date(
      new Date(baseDate).setDate(new Date(baseDate).getDate() + 1)
    )
      .toISOString()
      .split("T")[0];
  }

  var startLocal = convertMdtToLocalTime(startStr, baseDate);
  var endLocal = convertMdtToLocalTime(endStr, endBaseDate);
  var startHour = parseInt(startLocal.split(":")[0]) || 0;
  var endHour = parseInt(endLocal.split(":")[0]) || 0;
  return [startHour, endHour];
}

export function LocalTimeSchedule({
  schedules,
  descriptions = {},
  format = "time",
}) {
  const [schedule, setSchedule] = useState([]);

  // Pre-compute range map for each day
  const rangeMap = useMemo(() => {
    const map = {};
    const baseDate = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    for (const [dayName, ranges] of Object.entries(schedules)) {
      // Calculate the date for this day of the week
      const currentDay = baseDate.getDay();
      const targetDay = daysOfWeek.indexOf(dayName);
      const dayDiff = (targetDay - currentDay + 7) % 7;
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + dayDiff);
      const dateStr = dayDate.toISOString().split("T")[0];

      map[dayName] = ranges.map((range) => convertTimeRange(range, dateStr));
    }
    return map;
  }, [schedules]);

  useEffect(() => {
    const updateSchedule = () => {
      const now = new Date();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "shortGeneric",
        timeZone,
      });
      const hourlySchedule = Array.from({ length: 24 }, (_, i) => {
        const scheduleTime = new Date(now);
        scheduleTime.setHours(i, 0, 0, 0); // Start from 00:00
        const formattedTime = timeFormatter.format(scheduleTime);
        const statuses = {};
        for (const [dayName, ranges] of Object.entries(rangeMap)) {
          statuses[dayName] = ranges.some(([start, end]) =>
            isWithinRange(scheduleTime, start, end)
          );
        }
        const isCurrent =
          Math.abs(scheduleTime.getHours() - now.getHours()) < 1 &&
          now.getMinutes() < 60;
        return { time: formattedTime, statuses, isCurrent };
      });

      setSchedule(hourlySchedule);
    };

    updateSchedule();
    const interval = setInterval(updateSchedule, 60000);
    return () => clearInterval(interval);
  }, [rangeMap, format]);

  const scheduleDisplay = useMemo(() => {
    const columnNames = Object.keys(schedules);
    return (
      <table
        style={{
          borderCollapse: "collapse",
          width: "95%",
          border: "1px solid #ccc",
          height: "90vh",
          fontSize: "small",
        }}
      >
        <colgroup>
          <col style={{ width: "12%" }} />
          {columnNames.map((_, index) => (
            <col key={index} style={{ width: `${88 / columnNames.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc" }}>Time</th>
            {columnNames.map((name, index) => (
              <th key={index} style={{ border: "1px solid #ccc" }}>
                <div>{name}</div>
                <div style={{ fontSize: "smaller", fontWeight: "normal" }}>
                  {descriptions[name] ? (
                    <ul>
                      {descriptions[name].split("\n").map((item, i) => (
                        item.trim() && <li key={i}>{item.replace(/^- /, "")}</li>
                      ))}
                    </ul>
                  ) : (
                    ""
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map(({ time, statuses, isCurrent }, index) => (
            <tr key={index}>
              <td
                style={{
                  border: "1px solid #ccc",
                  backgroundColor: isCurrent ? "dimgrey" : "black",
                  width: "12%",
                  textAlign: "center",
                }}
              >
                {time}
              </td>
              {columnNames.map((columnName, colIndex) => {
                const isActive = statuses[columnName];
                const backgroundColor = isActive ? "grey" : "black";
                return (
                  <td
                    key={colIndex}
                    style={{
                      border: "1px solid #ccc",
                      backgroundColor,
                      color: isActive ? "#000" : "#666",
                    }}
                  ></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [schedule, format, schedules]);

  return (
    <div>
      <div>{scheduleDisplay}</div>
    </div>
  );
}
