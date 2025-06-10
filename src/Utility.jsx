import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./styles.css";

export default function Collapse({ trigger, children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();

  // Generate unique ID
  const triggerText =
    typeof trigger === "string" ? trigger : trigger.props.children;
  const id = `collapse-${(triggerText || "content")
    .replace(/\s+/g, "-")
    .replace(
      /[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}]/gu,
      ""
    ) // Remove emojis
    .replace(/[^\w\s]/g, "") // Remove special characters except spaces
    .trim() // Remove leading/trailing spaces
    .toLowerCase()}`;

  useEffect(() => {
    // Auto-expand if URL fragment matches
    if (location.hash === `#${id}`) {
      setIsCollapsed(false);
    }
  }, [location.hash, id]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
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
            toggleCollapse();
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
  console.log("Copying:", link);
  navigator.clipboard
    .writeText(link)
    .then(() => {
      alert("Copied: " + link);
    })
    .catch((err) => console.error("Clipboard error:", err));
}
