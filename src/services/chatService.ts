import { Session, Message, ConnectionStatus } from "../types/chat";

// TODO: REPLACE WITH YOUR ACTUAL API BASE URL
const API_BASE_URL = "https://development.prototype.api.axiumai.com";

export async function initiateChatSession(): Promise<Session> {
  console.log("🚀 Initiating chat session...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/initiate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY2MDQ2MzAwLCJpYXQiOjE3NjU5NTk5MDAsImp0aSI6IjQwMjNiZGI5OWY5YjRmMDY4M2RhMTEyMzQxMjNiZGJhIiwiaWQiOjY1MTM3MjQ0OTh9.nyoxwZSGzIieoo-QBuosK8IJ2okqbQT70Pw1Spyj4m0",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const json = await response.json();
    console.log("🔍 API Response:", json);

    // Adapt based on the reference code's extraction logic
    const sessionData = json.data?.data || json.data || json;

    return {
      sessionId: sessionData.session_id,
      websocketUrl: sessionData.websocket_url,
      websocketToken: sessionData.websocket_token,
      expiresIn: sessionData.expires_in || 60,
    };
  } catch (error) {
    console.error("❌ Failed to initiate session:", error);
    throw error;
  }
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onMessage?: (data: any) => void;
    onError?: (error: any) => void;
  };
  private messageQueue: string[] = [];
  private isAuthenticated = false;

  constructor(
    url: string,
    token: string,
    callbacks: {
      onOpen?: () => void;
      onClose?: () => void;
      onMessage?: (data: any) => void;
      onError?: (error: any) => void;
    }
  ) {
    this.url = url;
    this.token = token;
    this.callbacks = callbacks;
  }

  connect() {
    if (!this.url) return;

    // Construct URL with token query param
    const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`;
    console.log("🔌 Connecting to WebSocket:", wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("✅ WebSocket Connected");
      this.isAuthenticated = true;
      this.callbacks.onOpen?.();
      this.flushQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Received:", data);
        this.callbacks.onMessage?.(data);
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("🔴 WebSocket Closed");
      this.isAuthenticated = false;
      this.callbacks.onClose?.();
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
      this.callbacks.onError?.(error);
    };
  }

  send(text: string) {
    const payload = JSON.stringify({ message: text });

    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      this.isAuthenticated
    ) {
      this.ws.send(payload);
    } else {
      console.log("⏳ Queueing message:", text);
      this.messageQueue.push(payload);
    }
  }

  private flushQueue() {
    while (
      this.messageQueue.length > 0 &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const msg = this.messageQueue.shift();
      if (msg) this.ws.send(msg);
    }
  }

  close() {
    this.ws?.close();
  }
}
