import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { m, a, k, s, u } = (req.query || {}) as any;

    if (!u) {
      return res.status(400).json({ error: "Missing u" });
    }

    const decodedUrl = decodeURIComponent(String(u));

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceRoleKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      await supabase.from("events").insert([
        {
          event_name: "email_link_clicked",
          message_id: m ?? null,
          advisory_id: a ?? null,
          service_id: k ?? null,
          session_id: s ?? null,
          metadata: {
            redirect_url: decodedUrl,
          },
        },
      ]);
    }

    res.setHeader("Location", decodedUrl);
    return res.status(302).end();
  } catch (error) {
    console.error("Redirect tracking error:", error);
    return res.status(500).json({ error: "Failed to redirect" });
  }
}