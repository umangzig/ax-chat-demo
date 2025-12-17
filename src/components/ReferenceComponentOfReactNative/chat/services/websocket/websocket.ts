import { Session } from "../../types/chat";

export type WSCallbacks = {
  onOpen?: () => void;
  onClose?: (ev?: any) => void;
  onError?: (err?: any) => void;
  onMessage?: (data: any) => void;
};

export type WSHandle = {
  send: (text: string) => void;
  close: () => void;
  instance: WebSocket | null;
  readyState: number;
};

export function connectWebSocket(
  session: Session,
  cbs: WSCallbacks = {}
): WSHandle {
  let ws: WebSocket | null = null;
  let isAuthenticated = false;
  const messageQueue: string[] = [];

  if (!session?.websocketUrl) {
    console.error("WebSocket URL missing in session");
    return {
      send: () => {},
      close: () => {},
      instance: null,
      readyState: WebSocket.CLOSED,
    };
  }

  console.log("TEST UMANG URL:", session.websocketUrl);
  console.log("TEST UMANG Token:", encodeURIComponent(session.websocketToken));

  try {
    // Build WebSocket URL with token as query parameter
    const wsUrl = `${session.websocketUrl}?token=${encodeURIComponent(
      session.websocketToken
    )}`;

    ws = new WebSocket(wsUrl);

   ws.onopen = () => {
     console.log("✅ WebSocket connected");
     isAuthenticated = true;
     cbs.onOpen?.();

     // Send any queued messages
     messageQueue.forEach((msg) => ws?.send(msg));
     messageQueue.length = 0;
   };

   ws.onmessage = (evt) => {
     try {
       console.log("📨 Raw WebSocket message:", evt.data);
       const data = JSON.parse(evt.data);
       cbs.onMessage?.(data);
     } catch (err) {
       console.error("Error parsing WebSocket message:", err);
     }
   };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      cbs.onError?.(err);
    };

    ws.onclose = (e) => {
      console.log("🔴 WebSocket closed:", e.code, e.reason);
      isAuthenticated = false;
      cbs.onClose?.(e);
    };
  } catch (err) {
    console.error("❌ Error creating WebSocket:", err);
    cbs.onError?.(err);
  }

  return {
    send: (text: string) => {
      if (!ws) {
        console.warn("❌ WebSocket not initialized");
        return;
      }

      const payload = JSON.stringify({ message: text });

      if (ws.readyState === WebSocket.OPEN) {
        if (isAuthenticated) {
          console.log("📤 Sending message:", payload);
          ws.send(payload);
        } else {
          console.log("⏳ Queueing message (waiting for auth)");
          messageQueue.push(payload);
        }
      } else {
        console.warn("⚠️ WebSocket not ready. State:", ws.readyState);
      }
    },
    close: () => {
      ws?.close();
    },
    instance: ws,
    readyState: ws?.readyState || WebSocket.CLOSED,
  };
}
