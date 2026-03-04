import React from "react";

/* -------------------- Types -------------------- */

type TopService = {
  service_id: string;
  click_count: number;
};

type DetailedLocation = {
  location_base: string | null; // "Dubai" | "UAE" | "International"
  emirate: string | null;       // For UAE Local mostly (Sharjah, Abu Dhabi...)
  country: string | null;       // For International base mostly (Argentina, Taiwan...)
  scope: string | null;         // "Local" | "International"
  region: string | null;        // Expansion region (Africa, Europe...) when scope=International
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

type SectorScopeDemand = {
  scope: string;
  sector: string;
  count: number;
};

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
  sector_scope_demand: SectorScopeDemand[];
  region_sector_demand: RegionSectorDemand[];
};

/* -------------------- Formatters -------------------- */

function formatInt(value: number) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatPct(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}

function safeKey(x: any) {
  return String(x ?? "").trim() || "Unknown";
}

/* -------------------- Grouping Helpers -------------------- */

function sumWhere(rows: DetailedLocation[], pred: (r: DetailedLocation) => boolean) {
  return rows.reduce((acc, r) => acc + (pred(r) ? (r.count || 0) : 0), 0);
}

function groupSum<T extends Record<string, any>>(
  rows: T[],
  keyFn: (r: T) => string,
  valueFn: (r: T) => number
) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    m.set(k, (m.get(k) || 0) + (valueFn(r) || 0));
  }
  return Array.from(m.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

/* -------------------- Component -------------------- */

export default function AdminDashboard() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // "Show more" toggles
  const [showAllServices, setShowAllServices] = React.useState(false);
  const [showAllActivities, setShowAllActivities] = React.useState(false);
  const [showAllSectorScope, setShowAllSectorScope] = React.useState(false);
  const [showAllRegionSector, setShowAllRegionSector] = React.useState(false);
  const [showAllIntlCountries, setShowAllIntlCountries] = React.useState(false);
  const [showAllUaeEmirates, setShowAllUaeEmirates] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const adminKey = import.meta.env.VITE_ADMIN_KEY as string;

        const resp = await fetch("/api/analytics", {
          headers: { "x-admin-key": adminKey },
        });

        const json = await resp.json();

        if (!resp.ok) throw new Error(json?.error || "Failed to load analytics");

        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
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

  const totalViewed = kpis.results_viewed || 0;

  /* -------------------- Jurisdiction Totals -------------------- */

  const dubaiLocal = sumWhere(
    detailed_location,
    (r) => r.location_base === "Dubai" && r.scope === "Local"
  );
  const dubaiIntl = sumWhere(
    detailed_location,
    (r) => r.location_base === "Dubai" && r.scope === "International"
  );

  const uaeLocal = sumWhere(
    detailed_location,
    (r) => r.location_base === "UAE" && r.scope === "Local"
  );
  const uaeIntl = sumWhere(
    detailed_location,
    (r) => r.location_base === "UAE" && r.scope === "International"
  );

  const intlLocal = sumWhere(
    detailed_location,
    (r) => r.location_base === "International" && r.scope === "Local"
  );
  const intlIntl = sumWhere(
    detailed_location,
    (r) => r.location_base === "International" && r.scope === "International"
  );

  /* -------------------- UAE Top Emirates -------------------- */
  const uaeEmirateRowsRaw = detailed_location.filter(
    (r) => r.location_base === "UAE" && r.scope === "Local"
  );
  const uaeEmirates = groupSum(
    uaeEmirateRowsRaw,
    (r) => safeKey(r.emirate),
    (r) => r.count || 0
  );

  /* -------------------- International Top Countries -------------------- */
  const intlCountryRowsRaw = detailed_location.filter(
    (r) => r.location_base === "International" && r.scope === "Local"
  );
  const intlCountries = groupSum(
    intlCountryRowsRaw,
    (r) => safeKey(r.country),
    (r) => r.count || 0
  );

  /* -------------------- Top Insights -------------------- */

  const topRegion = region_demand?.[0];
  const topSector = sector_demand?.[0];
  const topUaeEmirate = uaeEmirates?.[0];
  const topIntlCountry = intlCountries?.[0];

  const dubaiLocalPct = totalViewed > 0 ? dubaiLocal / totalViewed : 0;

  /* -------------------- Limits -------------------- */

  const LIMIT = 8;

  const servicesRows = showAllServices ? top_services : top_services.slice(0, LIMIT);
  const activityRows = showAllActivities ? activity_breakdown : activity_breakdown.slice(0, 10);
  const sectorScopeRows = showAllSectorScope ? sector_scope_demand : sector_scope_demand.slice(0, 10);
  const regionSectorRows = showAllRegionSector ? region_sector_demand : region_sector_demand.slice(0, 10);

  const uaeEmirateRows = showAllUaeEmirates ? uaeEmirates : uaeEmirates.slice(0, LIMIT);
  const intlCountryRows = showAllIntlCountries ? intlCountries : intlCountries.slice(0, LIMIT);

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

      {/* TOP INSIGHTS STRIP */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <InsightCard
          title="Dubai Local Demand"
          primary={`${formatInt(dubaiLocal)} (${formatPct(dubaiLocalPct)})`}
          secondary="Share of total results viewed"
        />
        <InsightCard
          title="Top UAE Emirate"
          primary={topUaeEmirate ? `${topUaeEmirate.key} (${formatInt(topUaeEmirate.value)})` : "—"}
          secondary="UAE local (other emirates)"
        />
        <InsightCard
          title="Top Expansion Region"
          primary={topRegion ? `${topRegion.region} (${formatInt(topRegion.count)})` : "—"}
          secondary="International scope"
        />
        <InsightCard
          title="Top Sector"
          primary={topSector ? `${topSector.sector} (${formatInt(topSector.count)})` : "—"}
          secondary="Across all usage"
        />
      </div>

      {/* JURISDICTION STORY (NO LONG LIST) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Panel title="Dubai (Jurisdiction)">
          <MiniKpi label="Local" value={formatInt(dubaiLocal)} />
          <MiniKpi label="International" value={formatInt(dubaiIntl)} />
          <div className="pt-3 text-xs text-gray-500">
            Dubai should prioritize Dubai-only services. International reflects Dubai users seeking expansion.
          </div>
        </Panel>

        <Panel
          title="UAE (Other Emirates)"
          footer={
            uaeEmirates.length > LIMIT ? (
              <Toggle expanded={showAllUaeEmirates} onClick={() => setShowAllUaeEmirates((v) => !v)} />
            ) : null
          }
        >
          <MiniKpi label="Local" value={formatInt(uaeLocal)} />
          <MiniKpi label="International" value={formatInt(uaeIntl)} />
          <div className="mt-4 text-sm font-semibold text-[#003B5C]">Top Emirates (Local)</div>
          {uaeEmirateRows.length === 0 ? <Empty /> : null}
          {uaeEmirateRows.map((r, i) => (
            <Row key={`${r.key}-${i}`} label={r.key} value={formatInt(r.value)} />
          ))}
        </Panel>

        <Panel
          title="International (Inbound)"
          footer={
            intlCountries.length > LIMIT ? (
              <Toggle expanded={showAllIntlCountries} onClick={() => setShowAllIntlCountries((v) => !v)} />
            ) : null
          }
        >
          <MiniKpi label="Local (Dubai membership intent)" value={formatInt(intlLocal)} />
          <MiniKpi label="International (Expansion intent)" value={formatInt(intlIntl)} />

          <div className="mt-4 text-sm font-semibold text-[#003B5C]">Top Countries (Local)</div>
          {intlCountryRows.length === 0 ? <Empty /> : null}
          {intlCountryRows.map((r, i) => (
            <Row key={`${r.key}-${i}`} label={r.key} value={formatInt(r.value)} />
          ))}

          <div className="mt-6 text-sm font-semibold text-[#003B5C]">Top Regions (International)</div>
          {region_demand.length === 0 ? <Empty /> : null}
          {region_demand.slice(0, 5).map((r, i) => (
            <Row key={`${r.region}-${i}`} label={r.region} value={formatInt(r.count)} />
          ))}

          <div className="pt-3 text-xs text-gray-500">
            Use this to route to Dubai Global offices + track where inbound leads are coming from.
          </div>
        </Panel>
      </div>

      {/* OPERATIONS / BEHAVIOR PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Panel
          title="Top Clicked Email Services"
          footer={
            top_services.length > LIMIT ? (
              <Toggle expanded={showAllServices} onClick={() => setShowAllServices((v) => !v)} />
            ) : null
          }
        >
          {top_services.length === 0 && <Empty />}
          {servicesRows.map((service, i) => (
            <Row
              key={service.service_id}
              label={`${i + 1}. ${service.service_id}`}
              value={formatInt(service.click_count)}
            />
          ))}
        </Panel>

        <Panel title="Top Activities & Sectors">
          {activity_breakdown.length === 0 && <Empty />}
          {activityRows.map((row, i) => (
            <Row
              key={`${row.activity_id}-${i}`}
              label={`${row.sector} → ${row.subsector}`}
              value={formatInt(row.count)}
            />
          ))}
          {activity_breakdown.length > 10 ? (
            <div className="pt-3">
              <Toggle expanded={showAllActivities} onClick={() => setShowAllActivities((v) => !v)} />
            </div>
          ) : null}
        </Panel>

        <Panel title="Sector Demand (Overall)">
          {sector_demand.length === 0 && <Empty />}
          {sector_demand.slice(0, 10).map((row, i) => (
            <Row key={`${row.sector}-${i}`} label={row.sector} value={formatInt(row.count)} />
          ))}
        </Panel>
      </div>

      {/* STRATEGY PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Panel
          title="Sector Demand by Scope (Local vs International)"
          footer={
            sector_scope_demand.length > 10 ? (
              <Toggle expanded={showAllSectorScope} onClick={() => setShowAllSectorScope((v) => !v)} />
            ) : null
          }
        >
          {sector_scope_demand.length === 0 && <Empty />}
          {sectorScopeRows.map((row, i) => (
            <Row key={`${row.scope}-${row.sector}-${i}`} label={`${row.scope} → ${row.sector}`} value={formatInt(row.count)} />
          ))}
        </Panel>

        <Panel
          title="International Demand by Region + Sector"
          footer={
            region_sector_demand.length > 10 ? (
              <Toggle expanded={showAllRegionSector} onClick={() => setShowAllRegionSector((v) => !v)} />
            ) : null
          }
        >
          {region_sector_demand.length === 0 && <Empty />}
          {regionSectorRows.map((row, i) => (
            <Row key={`${row.region}-${row.sector}-${i}`} label={`${row.region} → ${row.sector}`} value={formatInt(row.count)} />
          ))}
        </Panel>
      </div>

      {/* OPTIONAL: Keep raw detailed list hidden behind toggle if you want later */}
    </div>
  );
}

/* -------------------- UI Helpers -------------------- */

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

function InsightCard({
  title,
  primary,
  secondary,
}: {
  title: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-xs uppercase text-gray-500">{title}</div>
      <div className="mt-2 text-xl font-semibold text-[#003B5C]">{primary}</div>
      <div className="mt-1 text-xs text-gray-500">{secondary}</div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b text-sm">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-[#003B5C]">{value}</span>
    </div>
  );
}