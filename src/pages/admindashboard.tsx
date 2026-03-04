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

  const LOCATION_LIMIT = 10;
  const SECTOR_SCOPE_LIMIT = 10;
  const REGION_SECTOR_LIMIT = 10;

  const locationRows = showAllLocation
    ? detailed_location
    : detailed_location.slice(0, LOCATION_LIMIT);

  const sectorScopeRows = showAllSectorScope
    ? sector_scope_demand
    : sector_scope_demand.slice(0, SECTOR_SCOPE_LIMIT);

  const regionSectorRows = showAllRegionSector
    ? region_sector_demand
    : region_sector_demand.slice(0, REGION_SECTOR_LIMIT);

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-semibold text-[#003B5C]">
        Advisory Engine Analytics
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Results Viewed" value={formatInt(kpis.results_viewed)} />
        <KpiCard label="Emails Submitted" value={formatInt(kpis.email_submitted)} />
        <KpiCard label="Submit Rate" value={formatPct(kpis.email_submit_rate)} />
        <KpiCard
          label="Click Rate from Viewed"
          value={formatPct(kpis.email_click_rate_from_viewed)}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Clicked Services */}
        <Panel title="Top Clicked Email Services">
          {top_services.length === 0 && <Empty />}
          {top_services.map((service, i) => (
            <Row
              key={service.service_id}
              label={`${i + 1}. ${service.service_id}`}
              value={formatInt(service.click_count)}
            />
          ))}
        </Panel>

        {/* Location & Scope */}
        <Panel
          title="Location & Scope Breakdown"
          footer={
            detailed_location.length > LOCATION_LIMIT ? (
              <Toggle
                expanded={showAllLocation}
                onClick={() => setShowAllLocation((v) => !v)}
              />
            ) : null
          }
        >
          {detailed_location.length === 0 && <Empty />}

          {locationRows.map((row, i) => {
            const labelParts = [
              row.location_base,
              row.emirate,
              row.country,
              row.scope,
              row.region,
            ].filter(Boolean);

            return (
              <Row
                key={i}
                label={labelParts.join(" → ")}
                value={formatInt(row.count)}
              />
            );
          })}
        </Panel>

        {/* Activity & Sector */}
        <Panel title="Top Activities & Sectors">
          {activity_breakdown.length === 0 && <Empty />}
          {activity_breakdown.slice(0, 10).map((row, i) => (
            <Row
              key={i}
              label={`${row.sector} → ${row.subsector}`}
              value={formatInt(row.count)}
            />
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
              <Toggle
                expanded={showAllSectorScope}
                onClick={() => setShowAllSectorScope((v) => !v)}
              />
            ) : null
          }
        >
          {sector_scope_demand.length === 0 && <Empty />}

          {sectorScopeRows.map((row, i) => (
            <Row
              key={i}
              label={`${row.scope} → ${row.sector}`}
              value={formatInt(row.count)}
            />
          ))}
        </Panel>

        {/* Region + Sector Demand (International only) (NEW) */}
        <Panel
          title="International Demand by Region + Sector"
          footer={
            region_sector_demand.length > REGION_SECTOR_LIMIT ? (
              <Toggle
                expanded={showAllRegionSector}
                onClick={() => setShowAllRegionSector((v) => !v)}
              />
            ) : null
          }
        >
          {region_sector_demand.length === 0 && <Empty />}

          {regionSectorRows.map((row, i) => (
            <Row
              key={i}
              label={`${row.region} → ${row.sector}`}
              value={formatInt(row.count)}
            />
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

function Toggle({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) {
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
      <div className="mt-2 text-3xl font-semibold text-[#003B5C]">
        {value}
      </div>
    </div>
  );
}