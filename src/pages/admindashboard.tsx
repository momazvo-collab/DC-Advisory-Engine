import React from "react";

type TopService = {
  service_id: string;
  click_count: number;
};

type DetailedLocation = {
  location_base: string | null;
  emirate: string | null;
  country: string | null;
  scope: string | null;
  region: string | null;
  count: number;
};

type ActivityBreakdown = {
  activity_id: string;
  sector: string;
  subsector: string;
  count: number;
};

type RegionDemand = {
  region: string;
  count: number;
};

type SectorDemand = {
  sector: string;
  count: number;
};

// ✅ NEW
type SectorScopeDemand = {
  scope: string;
  sector: string;
  count: number;
};

// ✅ NEW
type RegionSectorDemand = {
  region: string;
  sector: string;
  count: number;
};

type Kpis = {
  results_viewed: number;
  email_submitted: number;
  email_link_clicked: number;
  email_submit_rate: number;
  email_click_rate_from_submitted: number;
  email_click_rate_from_viewed: number;
};

type AnalyticsResponse = {
  kpis: Kpis;
  top_services: TopService[];
  detailed_location: DetailedLocation[];
  activity_breakdown: ActivityBreakdown[];
  region_demand: RegionDemand[];
  sector_demand: SectorDemand[];

  // ✅ NEW (must match API response keys)
  sector_scope_demand: SectorScopeDemand[];
  region_sector_demand: RegionSectorDemand[];
};

function formatInt(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPct(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}

function safeNum(n: any) {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}

function pctOf(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function top1<T>(rows: T[], getCount: (r: T) => number) {
  if (!rows || rows.length === 0) return null;
  return rows.reduce((best, r) => (getCount(r) > getCount(best) ? r : best), rows[0]);
}

function normalizeKey(s: any) {
  const v = String(s ?? "").trim();
  return v.length ? v : "Unknown";
}

/**
 * Build 3–6 management-ready insights from existing arrays.
 * ✅ No DB/API change required. Pure UI-side aggregation.
 */
function buildInsights(input: {
  kpis: Kpis;
  detailed_location: DetailedLocation[];
  sector_demand: SectorDemand[];
  region_demand: RegionDemand[];
  sector_scope_demand: SectorScopeDemand[];
  region_sector_demand: RegionSectorDemand[];
}) {
  const { kpis, detailed_location, sector_demand, region_demand, sector_scope_demand, region_sector_demand } =
    input;

  const totalViewed = safeNum(kpis.results_viewed);

  // ---- Location totals (Dubai / UAE / International) ----
  const baseTotals = new Map<string, number>();
  for (const row of detailed_location || []) {
    const base = normalizeKey(row.location_base);
    baseTotals.set(base, (baseTotals.get(base) || 0) + safeNum(row.count));
  }

  const dubaiTotal = baseTotals.get("Dubai") || 0;
  const uaeTotal = baseTotals.get("UAE") || 0;
  const intlBaseTotal = baseTotals.get("International") || 0;

  // ---- UAE top emirate (exclude Dubai) ----
  const uaeEmirateTotals = new Map<string, number>();
  for (const row of detailed_location || []) {
    if (String(row.location_base) !== "UAE") continue;
    const em = normalizeKey(row.emirate);
    // your schema sometimes stores AE in country and emirate as "Sharjah"; keep emirate focus
    uaeEmirateTotals.set(em, (uaeEmirateTotals.get(em) || 0) + safeNum(row.count));
  }
  // avoid counting Unknown if other emirates exist
  const uaeEmirateList = Array.from(uaeEmirateTotals.entries())
    .map(([emirate, count]) => ({ emirate, count }))
    .sort((a, b) => b.count - a.count);
  const topUaeEmirate = uaeEmirateList.find((x) => x.emirate !== "Unknown") || uaeEmirateList[0] || null;

  // ---- International inbound top country (location_base = International) ----
  const intlCountryTotals = new Map<string, number>();
  for (const row of detailed_location || []) {
    if (String(row.location_base) !== "International") continue;
    const c = normalizeKey(row.country);
    intlCountryTotals.set(c, (intlCountryTotals.get(c) || 0) + safeNum(row.count));
  }
  const intlCountryList = Array.from(intlCountryTotals.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
  const topIntlCountry = intlCountryList.find((x) => x.country !== "Unknown") || intlCountryList[0] || null;

  // ---- Outbound expansion top region (region_demand) ----
  const topRegion = top1(region_demand || [], (r) => safeNum((r as any).count));

  // ---- Top sector overall ----
  const topSector = top1(sector_demand || [], (r) => safeNum((r as any).count));

  // ---- Top sector by scope (local / international) ----
  const localSectorRows = (sector_scope_demand || []).filter((r) => String(r.scope) === "Local");
  const intlSectorRows = (sector_scope_demand || []).filter((r) => String(r.scope) === "International");
  const topLocalSector = top1(localSectorRows, (r) => safeNum((r as any).count));
  const topIntlSector = top1(intlSectorRows, (r) => safeNum((r as any).count));

  // ---- International hottest Region+Sector combo ----
  const topRegionSector = top1(region_sector_demand || [], (r) => safeNum((r as any).count));

  const bullets: { label: string; value: string }[] = [];

  // 1) Dubai share
  if (dubaiTotal > 0) {
    bullets.push({
      label: "Dubai demand share",
      value: `${formatInt(dubaiTotal)} (${pctOf(dubaiTotal, totalViewed)})`,
    });
  }

  // 2) UAE top emirate
  if (uaeTotal > 0 && topUaeEmirate) {
    bullets.push({
      label: "Top UAE emirate (outside Dubai)",
      value: `${topUaeEmirate.emirate} (${formatInt(topUaeEmirate.count)})`,
    });
  }

  // 3) Top inbound country
  if (intlBaseTotal > 0 && topIntlCountry) {
    bullets.push({
      label: "Top inbound country",
      value: `${topIntlCountry.country} (${formatInt(topIntlCountry.count)})`,
    });
  }

  // 4) Top expansion region
  if (topRegion && (topRegion as any).region) {
    bullets.push({
      label: "Top expansion region",
      value: `${(topRegion as any).region} (${formatInt(safeNum((topRegion as any).count))})`,
    });
  }

  // 5) Top sector overall
  if (topSector && (topSector as any).sector) {
    bullets.push({
      label: "Top sector overall",
      value: `${(topSector as any).sector} (${formatInt(safeNum((topSector as any).count))})`,
    });
  }

  // 6) Best local vs international sector (optional)
  if (topLocalSector && (topLocalSector as any).sector) {
    bullets.push({
      label: "Top Local sector",
      value: `${(topLocalSector as any).sector} (${formatInt(safeNum((topLocalSector as any).count))})`,
    });
  }
  if (topIntlSector && (topIntlSector as any).sector) {
    bullets.push({
      label: "Top International sector",
      value: `${(topIntlSector as any).sector} (${formatInt(safeNum((topIntlSector as any).count))})`,
    });
  }

  // 7) Hottest international combo
  if (topRegionSector && (topRegionSector as any).region && (topRegionSector as any).sector) {
    bullets.push({
      label: "Hottest Int’l combo",
      value: `${(topRegionSector as any).region} → ${(topRegionSector as any).sector} (${formatInt(
        safeNum((topRegionSector as any).count)
      )})`,
    });
  }

  // keep it short for management
  return bullets.slice(0, 6);
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // "show more" toggles (avoid infinite scroll panels)
  const [showAllLocation, setShowAllLocation] = React.useState(false);
  const [showAllSectorScope, setShowAllSectorScope] = React.useState(false);
  const [showAllRegionSector, setShowAllRegionSector] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const adminKey = import.meta.env.VITE_ADMIN_KEY as string;

        const resp = await fetch("/api/analytics", {
          headers: { "x-admin-key": adminKey },
        });

        const json = await resp.json();

        if (!resp.ok) {
          throw new Error(json?.error || "Failed to load analytics");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8">Loading analytics…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return null;

  const {
    kpis,
    top_services,
    detailed_location,
    activity_breakdown,
    region_demand,
    sector_demand,
    sector_scope_demand,
    region_sector_demand,
  } = data;

  const insights = buildInsights({
    kpis,
    detailed_location,
    sector_demand,
    region_demand,
    sector_scope_demand,
    region_sector_demand,
  });

  const LOCATION_LIMIT = 10;
  const SECTOR_SCOPE_LIMIT = 10;
  const REGION_SECTOR_LIMIT = 10;

  const locationRows = showAllLocation ? detailed_location : detailed_location.slice(0, LOCATION_LIMIT);

  const sectorScopeRows = showAllSectorScope
    ? sector_scope_demand
    : sector_scope_demand.slice(0, SECTOR_SCOPE_LIMIT);

  const regionSectorRows = showAllRegionSector
    ? region_sector_demand
    : region_sector_demand.slice(0, REGION_SECTOR_LIMIT);

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-semibold text-[#003B5C]">Advisory Engine Analytics</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Results Viewed" value={formatInt(kpis.results_viewed)} />
        <KpiCard label="Emails Submitted" value={formatInt(kpis.email_submitted)} />
        <KpiCard label="Submit Rate" value={formatPct(kpis.email_submit_rate)} />
        <KpiCard label="Click Rate from Viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
      </div>

      {/* ✅ TOP INSIGHTS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.length === 0 ? (
          <div className="text-sm text-gray-500">No insights yet.</div>
        ) : (
          insights.map((ins, i) => (
            <InsightCard key={i} label={ins.label} value={ins.value} />
          ))
        )}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Clicked Services */}
        <Panel title="Top Clicked Email Services">
          {top_services.length === 0 && <Empty />}
          {top_services.map((service, i) => (
            <Row key={service.service_id} label={`${i + 1}. ${service.service_id}`} value={formatInt(service.click_count)} />
          ))}
        </Panel>

        {/* Location & Scope */}
        <Panel
          title="Location & Scope Breakdown"
          footer={
            detailed_location.length > LOCATION_LIMIT ? (
              <Toggle expanded={showAllLocation} onClick={() => setShowAllLocation((v) => !v)} />
            ) : null
          }
        >
          {detailed_location.length === 0 && <Empty />}

          {locationRows.map((row, i) => {
            const labelParts = [row.location_base, row.emirate, row.country, row.scope, row.region].filter(Boolean);

            return <Row key={i} label={labelParts.join(" → ")} value={formatInt(row.count)} />;
          })}
        </Panel>

        {/* Activity & Sector */}
        <Panel title="Top Activities & Sectors" footer={activity_breakdown.length > 10 ? <div className="pt-3 text-xs text-gray-400">Showing top 10</div> : null}>
          {activity_breakdown.length === 0 && <Empty />}
          {activity_breakdown.slice(0, 10).map((row, i) => (
            <Row key={i} label={`${row.sector} → ${row.subsector}`} value={formatInt(row.count)} />
          ))}
        </Panel>
      </div>

      {/* SECOND GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Region Demand */}
        <Panel title="Region Demand">
          {region_demand.length === 0 && <Empty />}
          {region_demand.map((row, i) => (
            <Row key={i} label={row.region} value={formatInt(row.count)} />
          ))}
        </Panel>

        {/* Sector Demand */}
        <Panel title="Sector Demand">
          {sector_demand.length === 0 && <Empty />}
          {sector_demand.map((row, i) => (
            <Row key={i} label={row.sector} value={formatInt(row.count)} />
          ))}
        </Panel>
      </div>

      {/* THIRD GRID (NEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector Demand by Scope (NEW) */}
        <Panel
          title="Sector Demand by Scope (Local vs International)"
          footer={
            sector_scope_demand.length > SECTOR_SCOPE_LIMIT ? (
              <Toggle expanded={showAllSectorScope} onClick={() => setShowAllSectorScope((v) => !v)} />
            ) : null
          }
        >
          {sector_scope_demand.length === 0 && <Empty />}

          {sectorScopeRows.map((row, i) => (
            <Row key={i} label={`${row.scope} → ${row.sector}`} value={formatInt(row.count)} />
          ))}
        </Panel>

        {/* Region + Sector Demand (International only) (NEW) */}
        <Panel
          title="International Demand by Region + Sector"
          footer={
            region_sector_demand.length > REGION_SECTOR_LIMIT ? (
              <Toggle expanded={showAllRegionSector} onClick={() => setShowAllRegionSector((v) => !v)} />
            ) : null
          }
        >
          {region_sector_demand.length === 0 && <Empty />}

          {regionSectorRows.map((row, i) => (
            <Row key={i} label={`${row.region} → ${row.sector}`} value={formatInt(row.count)} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function Panel({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
      {footer ? <div className="pt-3">{footer}</div> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="pr-6">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}

function Toggle({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-semibold text-[#003B5C] hover:underline"
    >
      {expanded ? "Show less" : "View all"}
    </button>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-base font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}