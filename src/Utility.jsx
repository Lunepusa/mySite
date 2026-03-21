import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { useLocation } from "react-router-dom";
import "./styles.css";
import { useAuth, apiFetch, Login } from "./Auth";
import { PaymentChecker } from "./Profile";

// ──────────────────────────────────────────────────────────────────────────────
// Collapsible section component (accordion-style)
// ──────────────────────────────────────────────────────────────────────────────
export default function Collapse({ trigger, children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const { analyticsData } = useAnalytics();

  // Generate stable, URL-safe ID from trigger text (used for deep linking)
  const triggerText =
    typeof trigger === "string"
      ? trigger
      : Array.isArray(trigger.props.children)
        ? trigger.props.children.join("")
        : typeof trigger.props.children === "string"
          ? trigger.props.children
          : String(trigger.props.children || "content");

  const id = `collapse-${(triggerText || "content")
    .replace(/\s+/g, "-")
    .replace(
      /[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase()}`;

  // Auto-expand if URL hash matches this section's ID
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

// ──────────────────────────────────────────────────────────────────────────────
// Copy current page URL + fragment identifier to clipboard
// ──────────────────────────────────────────────────────────────────────────────
export function Copylink(id, location) {
  const baseUrl = window.location.origin;
  const path = location.pathname;
  const link = `${baseUrl}${path}#${id}`;
  console.log("Copying: ", link);
  navigator.clipboard
    .writeText(link)
    .catch((err) => console.error("Clipboard error:", err));
}

// ──────────────────────────────────────────────────────────────────────────────
// Right-click handler: copies deep link to section
// ──────────────────────────────────────────────────────────────────────────────
export const handlerightclick = (id, location, event) => {
  if (id) {
    event.stopPropagation();
    Copylink(id, location);
  }
  // Note: this line runs even if id is falsy (fallback behavior)
  Copylink(id, location);
};

// ──────────────────────────────────────────────────────────────────────────────
// Hook: Detects if this is the user's first visit (via localStorage)
// ──────────────────────────────────────────────────────────────────────────────
export const useFirstVisit = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const location = useLocation();
  const { analyticsData } = useAnalytics();

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      setShowConfirmation(true);
      // Note: we remove it immediately so refresh doesn't re-trigger
      localStorage.removeItem("hasVisited");
    }
  }, []);

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
    window.location.href = "https://www.coolmathgames.com/";
  };

  return { showConfirmation, handleAgree, handleDecline };
};

// ──────────────────────────────────────────────────────────────────────────────
// Age + site readiness confirmation popup (shown on first visit)
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
// Send Google Analytics event (with fallback warning)
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
// Parse UTM-style query param into source/medium pairs
// ──────────────────────────────────────────────────────────────────────────────
export const getSourceMedium = (queryParam) => {
  const mappings = {
    twitterbio: { source: "twitter", medium: "bio" },
    twitterdm: { source: "twitter", medium: "dm" },
    // ... many other predefined short-hands
    twittersd: { source: "twitter", medium: "sugardaddy" },
    twittered: { source: "twitter", medium: "sugardaddy" },
  };

  if (mappings[queryParam]) {
    return mappings[queryParam];
  }

  const hasSeparator = queryParam.includes("-") || queryParam.includes("_");
  const separator = queryParam.includes("-") ? "-" : "_";
  const parts = queryParam.split(separator);

  if (hasSeparator && parts.length === 2) {
    const [source, medium] = parts;
    if (source && medium) {
      return { source: source.toLowerCase(), medium: medium.toLowerCase() };
    }
  }

  if (!hasSeparator && queryParam && queryParam !== "none") {
    return { source: queryParam.toLowerCase(), medium: "unknown" };
  }

  return { source: "unknown", medium: "unknown" };
};

// ──────────────────────────────────────────────────────────────────────────────
// Simple debounce wrapper
// ──────────────────────────────────────────────────────────────────────────────
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Track click with automatic source/medium detection
// ──────────────────────────────────────────────────────────────────────────────
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
    source = "unknown";
    medium = "unknown";
  }

  trackEvent(category, "click", label, null, {
    custom_source: source,
    custom_medium: medium,
    source,
    medium,
    destination,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Context for sharing analytics source/medium across components
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
// Time zone / DST helpers (Mountain Time → local time conversion)
// ──────────────────────────────────────────────────────────────────────────────
function isDST(date) {
  const year = date.getFullYear();
  const dstStart = new Date(year, 2, 14 - (new Date(year, 2, 1).getDay() || 7));
  const dstEnd = new Date(year, 10, 7 - (new Date(year, 10, 1).getDay() || 7));
  return date >= dstStart && date < dstEnd;
}

export function convertMdtToLocalTime(
  mstTime,
  date = new Date().toISOString().split("T")[0],
  format = "time"
) {
  const formatOptionsMap = {
    time: { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "shortGeneric" },
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
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) throw new Error("Invalid date");

    const timeZoneAbbr = isDST(inputDate) ? "MDT" : "MST";
    const mstDateTimeStr = `${date} ${mstTime} ${timeZoneAbbr}`;
    const mstDate = new Date(mstDateTimeStr);

    if (isNaN(mstDate.getTime())) throw new Error("Invalid time");

    const formatter = new Intl.DateTimeFormat("en-US", {
      ...formatOptionsMap[format],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    let result = formatter.format(mstDate);
    if (format === "datetime") {
      const parts = result.split(", ");
      result = `${parts[0]} - ${parts[1]}`;
    }
    return result;
  } catch (error) {
    console.error("Error converting time:", error);
    return "Invalid time";
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Time range helpers used by LocalTimeSchedule
// ──────────────────────────────────────────────────────────────────────────────
function isWithinRange(time, startHour, endHour, isOvernight) {
  const hour = time.getHours();
  if (isOvernight) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

function convertTimeRange(range, baseDate) {
  let [startStr, endStr] = range.split(" - ").map((s) => s.trim().toLowerCase());
  let endBaseDate = baseDate;

  const startHour = parseInt(startStr.split(/[\s:]+/)[0]);
  const startMeridiem = startStr.split(/[\s:]+/).slice(-1)[0];
  const endHour = parseInt(endStr.split(/[\s:]+/)[0]);
  const endMeridiem = endStr.split(/[\s:]+/).slice(-1)[0];

  const isOvernight = endMeridiem === "am" && endHour < 7 && startMeridiem === "pm";

  if (isOvernight) {
    endBaseDate = new Date(new Date(baseDate).setDate(new Date(baseDate).getDate() + 1))
      .toISOString()
      .split("T")[0];
  }

  const startLocal = convertMdtToLocalTime(startStr, baseDate);
  const endLocal = convertMdtToLocalTime(endStr, endBaseDate);

  const startLocalHour = parseInt(startLocal.split(":")[0]) || 0;
  const endLocalHour = parseInt(endLocal.split(":")[0]) || 0;

  return [startLocalHour, endLocalHour, isOvernight];
}

// ──────────────────────────────────────────────────────────────────────────────
// Visual hourly availability schedule (MDT → local time, 24-hour grid)
// ──────────────────────────────────────────────────────────────────────────────
export function LocalTimeSchedule({
  schedules,
  descriptions = {},
  format = "time",
}) {
  const [schedule, setSchedule] = useState([]);
  const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

  // Pre-calculate local hour ranges for each day of week
  const rangeMap = useMemo(() => {
    const map = {};
    const baseDate = new Date();

    for (const [dayName, ranges] of Object.entries(schedules)) {
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

  // Update schedule every minute + initial render
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
        scheduleTime.setHours(i, 0, 0, 0);
        const formattedTime = timeFormatter.format(scheduleTime);

        const statuses = {};
        for (const [dayName, ranges] of Object.entries(rangeMap)) {
          statuses[dayName] = ranges.some(([start, end, isOvernight]) =>
            isWithinRange(scheduleTime, start, end, isOvernight)
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
    const now = new Date();
    const currentDay = daysOfWeek[now.getDay()];
    const currentHour = now.getHours();

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
        <caption style={{ fontSize: "smaller", color: "#666", padding: "5px" }}>
          Grey cells indicate available times
        </caption>
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
                      {descriptions[name].split("\n").map((item, i) =>
                        item.trim() && <li key={i}>{item.replace(/^- /, "")}</li>
                      )}
                    </ul>
                  ) : ""}
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
                  backgroundColor: "black",
                  width: "12%",
                  textAlign: "center",
                }}
              >
                {time}
              </td>
              {columnNames.map((columnName, colIndex) => {
                const isActive = statuses[columnName];
                const isCurrentCell = isCurrent && columnName === currentDay;
                const backgroundColor = isCurrentCell
                  ? "lightgrey"
                  : isActive
                    ? "grey"
                    : "black";

                return (
                  <td
                    key={colIndex}
                    style={{
                      border: isCurrentCell ? "3px dashed white" : "1px solid #ccc",
                      backgroundColor,
                      color: isActive || isCurrentCell ? "#000" : "#666",
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

  return <div>{scheduleDisplay}</div>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Wallet spend button + confirmation + reload collapse
// ──────────────────────────────────────────────────────────────────────────────
export function SpendFromWallet({
  amountCents,
  itemSlug,
  description,
  buttonText,
  disabled = false,
  onSuccess,
  onError,
  children,
  style = {},
  className = "",
}) {
  const { isLoggedIn, walletBalance, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const numericBalance = parseFloat(walletBalance) || 0;
  const hasEnough = numericBalance * 100 >= amountCents;

  const handleSpend = async () => {
    if (!hasEnough) {
      setError(`Insufficient balance: $${walletBalance} available`);
      if (onError) onError("Insufficient balance");
      return;
    }

    if (!confirm(`Spend $${(amountCents / 100).toFixed(2)} for "${description}"?`)) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch("/spend-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          itemSlug,
          description,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await refreshUser();
        setResult({ success: true, message: data.message || "Purchase successful" });
        if (onSuccess) onSuccess(data);
      } else {
        throw new Error(data.message || "Spend failed");
      }
    } catch (err) {
      console.error("Spend error:", err);
      setError(err.message || "Error spending from wallet");
      setResult({ success: false, message: err.message });
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isLoggedIn ? (
        <div>
          <p>Please log in to purchase</p>
          <Login />
        </div>
      ) : (
        <>
          <button
            onClick={handleSpend}
            disabled={loading || disabled || !hasEnough}
            style={{
              padding: "3px 6px",
              background:
                loading || disabled || !hasEnough || user.subscription_expires > 4542307200
                  ? "#666"
                  : "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || disabled || !hasEnough || user.subscription_expires > 4542307200
                  ? "not-allowed"
                  : "pointer",
              ...style,
            }}
            className={className}
          >
            {loading ? "Processing..." : children || buttonText}
          </button>

          {result && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: result.success ? "#1a3a1a" : "#3a1a1a",
                borderRadius: "8px",
                border: `2px solid ${result.success ? "#4caf50" : "#f44336"}`,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "1.1em",
              }}
            >
              {result.success ? "Success!" : "Failed"}
              <br />
              {result.message}
            </div>
          )}

          {error && (
            <p style={{ color: "orange", marginTop: "8px", fontSize: "0.9em" }}>
              {error}
            </p>
          )}

          {!hasEnough && !error && !result && (
            <p style={{ color: "orange", marginTop: "8px", fontSize: "0.9em" }}>
              Need ${(amountCents / 100).toFixed(2)} – current: ${walletBalance}
            </p>
          )}

          <div style={{ marginTop: "20px" }}>
            <Collapse
              trigger={
                <h2 style={{ margin: 0, cursor: "pointer" }}>
                  Reload Wallet (${walletBalance})
                </h2>
              }
            >
              <PaymentChecker />
            </Collapse>
          </div>
        </>
      )}
    </div>
  );
}