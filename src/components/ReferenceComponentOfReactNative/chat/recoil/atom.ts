import {
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import type { ConnectionStatus, Message, Session } from "../types/chat";
import { connectWebSocket, WSHandle } from "../services/websocket/websocket";
import { initiateChatSession } from "../services/api/api";

export interface UnifiedFixture {
  component: "fixture";
  league_name: string;
  league_id?: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_score?: number;
  away_score?: number;
  status: "kicked-off" | "prematch" | "scheduled" | "finished";
  event_start_date: string;
  match_time?: string;
  bets: Array<{
    selection_name: string;
    price_format: string;
    price: string;
  }>;
}

const messagesState = atom<Message[]>({
  key: "messagesState",
  default: [],
});

const isTypingState = atom<boolean>({
  key: "isTypingState",
  default: false,
});

const statusState = atom<ConnectionStatus>({
  key: "statusState",
  default: "idle",
});

const sessionState = atom<Session | null>({
  key: "sessionState",
  default: null,
});

const currentSessionIdState = atom<string | null>({
  key: "currentSessionIdState",
  default: null,
});

let wsRef: WSHandle | null = null;

// Flag to track if closure was intentional
let isIntentionalClose = false;

function closeWS(): void {
  isIntentionalClose = true;
  try {
    wsRef?.close();
  } catch {
    // Silently handle error
  }
  wsRef = null;
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatState() {
  return {
    messages: useRecoilValue(messagesState),
    isTyping: useRecoilValue(isTypingState),
    status: useRecoilValue(statusState),
    session: useRecoilValue(sessionState),
  };
}

export function useChatActions() {
  const setMessages = useSetRecoilState(messagesState);
  const [session, setSession] = useRecoilState(sessionState);
  const [currentSessionId, setCurrentSessionId] = useRecoilState(
    currentSessionIdState
  );
  const setIsTyping = useSetRecoilState(isTypingState);
  const setStatus = useSetRecoilState(statusState);

  const handleIncoming = (raw: any): void => {
    try {
      let originalText = "";
      let messagePayload = raw;

      if (raw && typeof raw === "object" && raw.message !== undefined) {
        originalText = raw.message || "";
      } else {
        originalText = typeof raw === "string" ? raw : JSON.stringify(raw);
      }

      // Check if response contains any fixture components
      const hasFixtures = raw?.components?.some(
        (c: any) => c.component === "fixture"
      );

      if (hasFixtures) {
        originalText = "{unified_fixture_table}";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: originalText,
          createdAt: Date.now(),
          rawData: messagePayload,
        },
      ]);
    } catch (err) {
      console.error("Error parsing incoming message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: "Sorry, something went wrong.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* 
    Helper to start a new session.
    isReconnection: if true, we add a SESSION_DIVIDER and tread it as expiry recovery.
  */
  const startNewSession = async (isReconnection = false) => {
    setIsTyping(true);
    try {
      const sess = await initiateChatSession();

      if (isReconnection) {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "system",
            text: "SESSION_DIVIDER",
            createdAt: Date.now(),
          },
        ]);
      }

      setSession(sess);
      setCurrentSessionId(sess.sessionId);
      await connect(sess);

      // Trigger backend greeting
      wsRef?.send("Hello");
    } catch (err) {
      console.error("Failed to start/restart session:", err);
      setIsTyping(false);
    }
  };

  const connect = (sess: Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      setStatus("connecting");
      isIntentionalClose = false; // Reset flag on new connection attempt

      wsRef = connectWebSocket(sess, {
        onOpen: () => {
          setStatus("connected");
          resolve();
        },
        onClose: () => {
          setStatus("closed");
          reject();

          // If not intentional, assume expiry/error and try to reconnect with new session
          if (!isIntentionalClose) {
            console.log(
              "WebSocket closed unexpectedly. Initiating new session..."
            );
            startNewSession(true);
          }
        },
        onError: (err) => {
          console.error("WebSocket error:", err);
          setStatus("error");
          reject(err);
        },
        onMessage: handleIncoming,
      });

      setTimeout(() => {
        if (wsRef?.instance?.readyState !== WebSocket.OPEN) {
          // If timeout, we don't necessarily want to trigger auto-reconnect unless it closed?
          // The promise rejects here.
          // Probably fine to leave as is.
          reject(new Error("WebSocket timeout"));
        }
      }, 10000);
    });
  };

  const reset = (): void => {
    closeWS(); // component sets isIntentionalClose = true
    setMessages([]);
    setSession(null);
    setCurrentSessionId(null);
    setIsTyping(false);
    setStatus("idle");
  };

  const sendMessage = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", text: trimmed, createdAt: Date.now() },
    ]);

    setIsTyping(true);

    const performSend = async (currentSession: Session | null) => {
      if (!currentSession) {
        // Initial connect flow
        const sess = await initiateChatSession();
        // Check if we need divider (unlikely here as it's fresh, but consistent with old logic)
        if (currentSessionId && currentSessionId !== sess.sessionId) {

        }

        setSession(sess);
        setCurrentSessionId(sess.sessionId);
        await connect(sess);
        wsRef?.send(trimmed);
        return;
      }

      // Existing session
      if (!wsRef || wsRef.instance?.readyState !== WebSocket.OPEN) {
        await connect(currentSession);
      }
      wsRef?.send(trimmed);
    };

    try {
      await performSend(session);
    } catch (error) {
      console.log(
        "Send failed, attempting to recover with new session...",
        error
      );

      try {
        // Force new session (reconnection flow)
        await startNewSession(true);
        // Note: startNewSession sends "Hello".
        // Now we re-send the user message.
        // wsRef is updated by startNewSession (it uses the module-level variable)
        if (wsRef && wsRef.instance?.readyState === WebSocket.OPEN) {
          wsRef.send(trimmed);
        } else {
          throw new Error("Socket still not open after recovery");
        }
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        setIsTyping(false);
        setStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            text: "Connection error. Try again.",
            createdAt: Date.now(),
          },
        ]);
      }
    }
  };

  const initiateChat = async () => {
    // Initiate session if not exists
    if (!session) {
      await startNewSession(false);
    }
  };

  return { sendMessage, reset, initiateChat };
}
