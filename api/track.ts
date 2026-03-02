import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};

    if (!body?.event_name) {
      return res.status(400).json({ error: "Missing event_name" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Track API error: Missing Supabase environment variables");
      return res.status(500).json({ error: "Failed to track event" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error } = await supabase.from("events").insert(body);

    if (error) {
      console.error("Track API Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to track event" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Track API error:", error);
    return res.status(500).json({ error: "Failed to track event" });
  }
}
