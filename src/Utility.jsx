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

  return (
    <div className="collapsible" id={id}>
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


export function ContextMenu({ onCopyLink }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetId, setTargetId] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleContextMenu = (e) => {
      // Debug: Log event target and coordinates
      console.log("Right-click detected:", {
        target: e.target,
        className: e.target.className,
        clientX: e.clientX,
        clientY: e.clientY,
      });

      // Broader selector to catch nested elements
      const target = e.target.closest(".collapsible, .clickable-image, [id], .collapsible-trigger, .clickable-img-img");
      const id =
        target?.id ||
        target?.querySelector(".content[id]")?.id ||
        target?.closest(".collapsible")?.querySelector(".content[id]")?.id ||
        target?.closest(".clickable-image")?.id;

      if (id) {
        console.log("Target ID found:", id);
        e.preventDefault(); // Prevent default context menu
        setTargetId(id);
        const adjustedPosition = {
          x: Math.min(e.clientX, window.innerWidth - 150), // Avoid overflow
          y: Math.min(e.clientY, window.innerHeight - 50),
        };
        setPosition(adjustedPosition);
        setVisible(true);
      } else {
        console.log("No valid ID found for target:", target);
      }
    };

    const handleClick = (e) => {
      console.log("Click detected, hiding menu");
      setVisible(false);
    };

    // Attach to multiple targets to ensure capture
    const targets = [window, document, document.body];
    targets.forEach((target) => {
      target.addEventListener("contextmenu", handleContextMenu, { passive: false });
      target.addEventListener("click", handleClick);
    });

    return () => {
      targets.forEach((target) => {
        target.removeEventListener("contextmenu", handleContextMenu);
        target.removeEventListener("click", handleClick);
      });
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!visible || !targetId) {
    return null;
  }

  const copyLink = () => {
    const baseUrl = window.location.origin;
    const basename = process.env.REACT_APP_BASENAME || "/home-app";
    const path = location.pathname.replace(new RegExp(`^${basename}`), "");
    const link = `${baseUrl}${basename}${path}#${targetId}`;
    console.log("Copying link:", link);
    navigator.clipboard.writeText(link).then(() => {
      setVisible(false);
      onCopyLink?.();
    }).catch((err) => console.error("Failed to copy link:", err));
  };

  return (
    <ul
      className="context-menu"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
    >
      <li
        className="context-menu-item"
        onClick={copyLink}
        role="menuitem"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            copyLink();
          }
        }}
      >
        Copy Section Link
      </li>
      {/* Debug overlay */}
      <li style={{ padding: "5px", color: "white", fontSize: "12px" }}>
        Debug ID: {targetId}
      </li>
    </ul>
  );
}
