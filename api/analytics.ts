import { createClient } from "@supabase/supabase-js";

function validateAdmin(req: any): boolean {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error("Missing ADMIN_SECRET environment variable");
    return false;
  }

  const headerKey = req.headers["x-admin-key"];
  return headerKey === adminSecret;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!validateAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
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

    // Default date range = last 30 days
    const now = new Date();
    const defaultTo = now.toISOString();
    const defaultFrom = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const dateFrom = q.from ? new Date(q.from).toISOString() : defaultFrom;
    const dateTo = q.to ? new Date(q.to).toISOString() : defaultTo;

    const params = {
      p_from: dateFrom,
      p_to: dateTo,
      p_scope: q.scope ?? null,
      p_location_base: q.location_base ?? null,
      p_region: q.region ?? null,
      p_activity_id: q.activity_id ?? null,
      p_service_id: q.service_id ?? null,
    };

    // Existing KPIs
    const { data: kpis, error: kpisError } =
      await supabase.rpc("analytics_kpis", params);

    if (kpisError) {
      console.error("Analytics KPI RPC error:", kpisError);
      return res.status(500).json({ error: "Failed to load analytics" });
    }

    // 🔥 NEW: Top clicked services
    const { data: topServices, error: topError } =
      await supabase.rpc("analytics_top_clicked_services", {
        p_from: dateFrom,
        p_to: dateTo,
      });

    if (topError) {
      console.error("Top services RPC error:", topError);
      return res.status(500).json({ error: "Failed to load top services" });
    }

    return res.status(200).json({
      ...kpis,
      top_services: topServices ?? [],
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}