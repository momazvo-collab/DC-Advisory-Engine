export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { m, a, k, u } = (req.query || {}) as any;

    if (!u) {
      return res.status(400).json({ error: "Missing u" });
    }

    const decodedUrl = decodeURIComponent(String(u));

    console.log("email_link_clicked", {
      message_id: m,
      advisory_id: a,
      service_id: k,
      timestamp: Date.now(),
    });

    res.setHeader("Location", decodedUrl);
    return res.status(302).end();
  } catch (error) {
    console.error("Redirect tracking error:", error);
    return res.status(500).json({ error: "Failed to redirect" });
  }
}
