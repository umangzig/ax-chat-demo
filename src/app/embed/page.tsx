"use client";

import React, { useState, useEffect } from "react";
import ChatApp from "../../components/ChatApp";
import styles from "./embed.module.css";

export default function EmbedPage() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    // Notify parent window about size change
    window.parent.postMessage(
      {
        type: "AXIUM_WIDGET_RESIZE",
        isOpen: newState,
      },
      "*"
    );
  };

  return (
    <div className={styles.embedContainer}>
      <div className={`${styles.chatWrapper} ${isOpen ? styles.open : ""}`}>
        <ChatApp />
      </div>

      <button
        className={`${styles.toggleButton} ${isOpen ? styles.open : ""}`}
        onClick={toggleWidget}
        aria-label="Toggle Chat">
        {isOpen ? (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
