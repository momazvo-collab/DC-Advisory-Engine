import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Analytics API error: Missing Supabase environment variables");
      return res.status(500).json({ error: "Failed to load analytics" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const q = (req.query || {}) as any;

    const now = new Date();
    const defaultTo = now.toISOString();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const params = {
      p_from: q.from ?? defaultFrom,
      p_to: q.to ?? defaultTo,
      p_scope: q.scope ?? null,
      p_location_base: q.location_base ?? null,
      p_region: q.region ?? null,
      p_activity_id: q.activity_id ?? null,
      p_service_id: q.service_id ?? null,
    };

    const { data, error } = await supabase.rpc("analytics_kpis", params);

    if (error) {
      console.error("Analytics API Supabase RPC error:", error);
      return res.status(500).json({ error: "Failed to load analytics" });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Analytics API error:", error);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}