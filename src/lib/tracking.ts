export function getOrCreateSessionId() {
  try {
    if (typeof window === "undefined") return "";

    const existing = window.localStorage.getItem("dc_session_id");
    if (existing) return existing;

    const sessionId = crypto.randomUUID();
    window.localStorage.setItem("dc_session_id", sessionId);
    return sessionId;
  } catch (err) {
    console.error("getOrCreateSessionId error:", err);
    return "";
  }
}

export async function trackEvent(eventName: string, payload: any) {
  try {
    const sessionId = getOrCreateSessionId();

    const body = {
      event_name: eventName,
      session_id: sessionId,
      advisory_id: payload?.advisory_id,
      timestamp: Date.now(),
      ...payload,
    };

    void fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("trackEvent error:", err);
  }
}
