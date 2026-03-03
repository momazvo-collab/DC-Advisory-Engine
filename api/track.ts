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

    const eventData = {
  event_name: body.event_name,
  session_id: body.session_id ?? null,
  advisory_id: body.advisory_id ?? null,
  message_id: body.message_id ?? null,
  service_id: body.service_id ?? null,
  activity_id: body.activity_id ?? null,
  sector: body.sector ?? null,
  subsector: body.subsector ?? null,
  scope: body.scope ?? null,
  location_base: body.location_base ?? null,
  emirate: body.emirate ?? null,        // ✅ NEW
  country: body.country ?? null,        // ✅ NEW
  region: body.region ?? null,
  metadata: body.metadata ?? null,
};

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Track API error: Missing Supabase environment variables");
      return res.status(500).json({ error: "Failed to track event" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error } = await supabase.from("events").insert([eventData]);

    if (error) {
      console.error("Track API Supabase insert error:", error);
      return res.status(500).json({
        error: error.message,
        details: (error as any).details ?? null,
        hint: (error as any).hint ?? null,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Track API error:", error);
    return res.status(500).json({ error: "Failed to track event" });
  }
}
