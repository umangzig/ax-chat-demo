import { apiResponse } from "@/api/api";
import { Session } from "../../types/chat";

function toSession(json: any): Session {
  console.log("🔍 Raw JSON in toSession:", JSON.stringify(json, null, 2));

  const sessionData = json.data?.data || json.data || json;
  console.log(
    "🔍 Extracted sessionData:",
    JSON.stringify(sessionData, null, 2)
  );

  const session = {
    sessionId: sessionData.session_id,
    websocketUrl: sessionData.websocket_url,
    websocketToken: sessionData.websocket_token,
    expiresIn: sessionData.expires_in || 60,
  };

  console.log("✅ Final session object:", JSON.stringify(session, null, 2));
  return session;
}

export async function initiateChatSession(): Promise<Session> {
  try {
    const response = await apiResponse({
      method: "post",
      endpoint: "api/chat/initiate/",
      data: {},
    });

    console.log("🔍 Full API Response structure:", {
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : "no data",
      nestedData: response?.data?.data
        ? Object.keys(response.data.data)
        : "no nested data",
    });

    if (!response?.data) {
      throw new Error("Invalid response: missing data");
    }

    const session = toSession(response);
    console.log("🎯 Session ready for WebSocket:", session.websocketUrl);

    return session;
  } catch (error) {
    console.error("Failed to initiate chat session:", error);
    throw error;
  }
}
