import { createClient } from "@supabase/supabase-js";

import fs from "fs";
import path from "path";

let activitiesCatalogue: any[] = [];

try {
  const activitiesPath = path.join(process.cwd(), "src/data/activities.json");
  activitiesCatalogue = JSON.parse(fs.readFileSync(activitiesPath, "utf-8"));
} catch (e) {
  console.warn("Failed to load activities catalogue:", e);
}

const ACTIVITY_NAME_BY_ID: Record<string, string> = (activitiesCatalogue as any[]).reduce(
  (acc, row) => {
    const id = String((row as any)?.activity_id ?? "");
    const name = String((row as any)?.activity_name ?? "");
    if (id) acc[id] = name || id;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Temporary admin guard.
 * Can later be replaced with Supabase Auth.
 */
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
      console.error("Missing Supabase environment variables");
      return res.status(500).json({ error: "Analytics not configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const q = (req.query || {}) as any;


// -------------------------------
// Date Range Handling
// -------------------------------
const now = new Date();

let dateFrom: string;
let dateTo: string = now.toISOString();

if (q.range === "7d") {
  dateFrom = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
}

else if (q.range === "30d") {
  dateFrom = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
}

else {
  // ALL data
  dateFrom = new Date(0).toISOString();
}
    // -------------------------------
    // KPI Params
    // -------------------------------
    const kpiParams = {
      p_from: dateFrom,
      p_to: dateTo,
      p_scope: q.scope ?? null,
      p_location_base: q.location_base ?? null,
      p_region: q.region ?? null,
      p_activity_id: q.activity_id ?? null,
      p_service_id: q.service_id ?? null,
    };

    // -------------------------------
    // 1️⃣ KPI Metrics
    // -------------------------------
    const { data: kpis, error: kpisError } = await supabase.rpc(
      "analytics_kpis",
      kpiParams
    );

    if (kpisError) {
      console.error("KPI RPC error:", kpisError);
      return res.status(500).json({ error: "Failed to load KPIs" });
    }

    // -------------------------------
    // 2️⃣ Top Clicked Email Services
    // -------------------------------
    const { data: topServices, error: topError } = await supabase.rpc(
      "analytics_top_clicked_services",
      { p_from: dateFrom, p_to: dateTo }
    );

    if (topError) {
      console.error("Top services RPC error:", topError);
      return res.status(500).json({ error: "Failed to load top services" });
    }

    // -------------------------------
    // 3️⃣ Detailed Location Breakdown
    // -------------------------------
    const { data: detailedLocation, error: locationError } = await supabase.rpc(
      "analytics_detailed_location_breakdown",
      { p_from: dateFrom, p_to: dateTo }
    );

    if (locationError) {
      console.error("Location breakdown RPC error:", locationError);
      return res.status(500).json({ error: "Failed to load location breakdown" });
    }

    // -------------------------------
    // 4️⃣ Activity / Sector Breakdown
    // -------------------------------
    const { data: activityBreakdown, error: activityError } = await supabase.rpc(
      "analytics_activity_breakdown",
      { p_from: dateFrom, p_to: dateTo }
    );

    if (activityError) {
      console.error("Activity breakdown RPC error:", activityError);
      return res.status(500).json({ error: "Failed to load activity breakdown" });
    }

    const activityBreakdownEnriched = (activityBreakdown ?? []).map((r: any) => {
      const activity_id = String(r?.activity_id ?? "");
      return {
        ...r,
        activity_id,
        activity_name: ACTIVITY_NAME_BY_ID[activity_id] ?? activity_id,
      };
    });

    // -------------------------------
    // 5️⃣ Region Demand
    // -------------------------------
    const { data: regionDemand, error: regionError } = await supabase.rpc(
      "analytics_region_demand",
      { p_from: dateFrom, p_to: dateTo }
    );

    if (regionError) {
      console.error("Region demand RPC error:", regionError);
      return res.status(500).json({ error: "Failed to load region demand" });
    }

    // -------------------------------
    // 6️⃣ Sector Demand
    // -------------------------------
    const { data: sectorDemand, error: sectorError } = await supabase.rpc(
      "analytics_sector_demand",
      { p_from: dateFrom, p_to: dateTo }
    );

    if (sectorError) {
      console.error("Sector demand RPC error:", sectorError);
      return res.status(500).json({ error: "Failed to load sector demand" });
    }

    // -------------------------------
    // 7️⃣ Sector Demand by Scope (NEW)
    // -------------------------------
    const { data: sectorScopeDemand, error: sectorScopeError } =
      await supabase.rpc("analytics_sector_scope_demand", {
        p_from: dateFrom,
        p_to: dateTo,
      });

    if (sectorScopeError) {
      console.error("Sector-scope demand RPC error:", sectorScopeError);
      return res.status(500).json({ error: "Failed to load sector-scope demand" });
    }
// -------------------------------
// 8️⃣ International Region + Sector Demand
// -------------------------------
const { data: regionSectorDemand, error: regionSectorError } =
  await supabase.rpc("analytics_region_sector_demand", {
    p_from: dateFrom,
    p_to: dateTo,
  });

if (regionSectorError) {
  console.error("Region-sector demand RPC error:", regionSectorError);
  return res.status(500).json({ error: "Failed to load region-sector demand" });
}

// -------------------------------
// 9️⃣ Region + Sector + Activity Demand (NEW)
// -------------------------------
const { data: regionSectorActivityDemand, error: regionSectorActivityError } =
  await supabase.rpc("region_sector_activity_demand");

if (regionSectorActivityError) {
  console.warn(
    "Region-sector-activity demand RPC error:",
    regionSectorActivityError
  );
}

return res.status(200).json({
  kpis: kpis ?? {},
  top_services: topServices ?? [],
  detailed_location: detailedLocation ?? [],
  activity_breakdown: activityBreakdownEnriched,
  region_demand: regionDemand ?? [],
  sector_demand: sectorDemand ?? [],
  sector_scope_demand: sectorScopeDemand ?? [],
  region_sector_demand: regionSectorDemand ?? [],
  region_sector_activity_demand: regionSectorActivityDemand ?? [],
});
  } catch (error) {
    console.error("Analytics API fatal error:", error);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
}