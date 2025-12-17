"use client";

import React, { useState, useEffect, useRef } from "react";
import "../styles/ChatApp.css";
import { Message, ConnectionStatus } from "../types/chat";
import { initiateChatSession, WebSocketClient } from "../services/chatService";
import { MarketTemplate } from "./chat/MarketTemplate";
import { UnifiedFixtureTable } from "./chat/FixtureTable";
import { MarketTemplateData, UnifiedFixture } from "../types/chat";

// Helper to extract components from the message
function extractComponents(
  messageText: string,
  rawData?: any
): {
  displayText: string;
  marketTemplates: MarketTemplateData[];
  unifiedFixtures: UnifiedFixture[];
} {
  const marketTemplates: MarketTemplateData[] = [];
  const unifiedFixtures: UnifiedFixture[] = [];

  // Extract components from rawData (received from socket)
  if (rawData?.components && Array.isArray(rawData.components)) {
    rawData.components.forEach((c: any) => {
      if (c.component === "market_template") {
        marketTemplates.push(c as MarketTemplateData);
      } else if (
        c.component === "fixture" ||
        c.component === "fixture_card" ||
        c.component === "fixture_table" // or kickoff_table
      ) {
        unifiedFixtures.push(c as UnifiedFixture);
      }
    });
  }

  // Remove placeholder text
  const cleanText = messageText
    .replace(/\{market_template\}/g, "")
    .replace(/\{unified_fixture_table\}/g, "")
    .trim();

  return {
    displayText: cleanText || "",
    marketTemplates,
    unifiedFixtures,
  };
}

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const wsClientRef = useRef<WebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Chat
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setStatus("connecting");
        const session = await initiateChatSession();

        if (!active) return;

        wsClientRef.current = new WebSocketClient(
          session.websocketUrl,
          session.websocketToken,
          {
            onOpen: () => setStatus("connected"),
            onClose: () => setStatus("closed"),
            onError: () => setStatus("error"),
            onMessage: (data) => {
              // Handle incoming messages
              // Assuming data structure matches Message or needs mapping
              // Based on ref code: it receives standard JSON payload
              // We need to verify the payload structure.
              // For now, let's assume if it has 'text' or 'message' it's a chat message

              const text = data.text || data.message || "";
              const sender = data.role || "assistant";

              const newMsg: Message = {
                id: data.id || Date.now().toString(),
                role: sender,
                text: text,
                createdAt: Date.now(),
                rawData: data,
              };

              setMessages((prev) => [...prev, newMsg]);
              setIsTyping(false);
            },
          }
        );

        wsClientRef.current.connect();
        setIsLoading(false);
      } catch (err) {
        console.error("Init failed", err);
        setStatus("error");
        setIsLoading(false);
      }
    };

    init();

    return () => {
      active = false;
      wsClientRef.current?.close();
    };
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Optimistic Update
    const tempMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: inputValue,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Send via Socket
    wsClientRef.current?.send(inputValue);

    setInputValue("");
    setIsTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="status-wrapper">
          <span className={`status-dot ${status}`}></span>
          <div>
            <h1>Ax-Chat</h1>
            <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
              {status === "connected" ? "Online" : status}
            </span>
          </div>
        </div>
      </header>

      <div className="messages-area">
        {messages.length === 0 && !isLoading && (
          <div
            style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>
            Start a conversation...
          </div>
        )}

        {messages.map((msg, index) => {
          const { displayText, marketTemplates, unifiedFixtures } =
            extractComponents(msg.text, msg.rawData);
          const hasComponents =
            marketTemplates.length > 0 || unifiedFixtures.length > 0;

          return (
            <div
              key={msg.id || index}
              className={`message-row ${
                msg.role === "user" ? "sent" : "received"
              }`}
              style={{
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
              {/* Text Bubble */}
              {displayText && (
                <div className="message-bubble" style={{ marginBottom: 4 }}>
                  {displayText}
                  <span className="timestamp" suppressHydrationWarning>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {/* Fixture Tables */}
              {unifiedFixtures.length > 0 && (
                <div style={{ width: "100%", maxWidth: "100%" }}>
                  <UnifiedFixtureTable data={unifiedFixtures} />
                </div>
              )}

              {/* Market Templates (Bet Pills) */}
              {marketTemplates.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    width: "100%",
                  }}>
                  {marketTemplates.map((template, i) => (
                    <MarketTemplate key={i} data={template} />
                  ))}
                </div>
              )}

              {/* Timestamp for component-only messages */}
              {hasComponents && !displayText && (
                <span
                  className="timestamp"
                  suppressHydrationWarning
                  style={{
                    display: "block",
                    textAlign: msg.role === "user" ? "right" : "left",
                    fontSize: "0.7rem",
                    color: "#999",
                    margin: "0 4px",
                  }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator-container">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ padding: 20, textAlign: "center" }}>Connecting...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={status !== "connected"}
        />
        <button
          className="send-button"
          onClick={() => handleSendMessage()}
          aria-label="Send message"
          disabled={status !== "connected"}>
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
