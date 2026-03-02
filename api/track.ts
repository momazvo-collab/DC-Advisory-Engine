export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { event_name, ...rest } = req.body || {};

    if (!event_name) {
      return res.status(400).json({ error: "Missing event_name" });
    }

    console.log("track_event", { event_name, ...rest });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Track API error:", error);
    return res.status(500).json({ error: "Failed to track event" });
  }
}
