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
      console.log("Right-click detected on:", e.target); // Debug
      // Target elements with id or their descendants
      const target = e.target.closest(".collapsible,[id]");
      if (target && (target.id || target.querySelector(".content[id]"))) {
        const id = target.id || target.querySelector(".content[id]").id;
        console.log("Target ID:", id); // Debug
        e.preventDefault();
        setTargetId(id);
        setPosition({ x: e.clientX, y: e.clientY });
        setVisible(true);
      } else {
        console.log("No valid ID found"); // Debug
      }
    };

    const handleClick = () => {
      console.log("Click elsewhere, hiding menu"); // Debug
      setVisible(false);
    };

    // Attach to both window and document for CodeSandbox
    const targets = [window, document];
    targets.forEach((target) => {
      target.addEventListener("contextmenu", handleContextMenu);
      target.addEventListener("click", handleClick);
    });
    return () => {
      targets.forEach((target) => {
        target.removeEventListener("contextmenu", handleContextMenu);
        target.removeEventListener("click", handleClick);
      });
    };
  }, []);

  // Handle clicks outside the menu
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
    console.log("ContextMenu not rendering:", { visible, targetId }); // Debug
    return null;
  }

  const copyLink = () => {
    const baseUrl = window.location.origin;
    const basename = "/home-app"; // Match BrowserRouter basename
    const path = location.pathname.replace(basename, "");
    const link = `${baseUrl}${basename}${path}#${targetId}`;
    console.log("Copying link:", link); // Debug
    navigator.clipboard.writeText(link).then(() => {
      setVisible(false);
      onCopyLink?.();
    });
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
    </ul>
  );
}
