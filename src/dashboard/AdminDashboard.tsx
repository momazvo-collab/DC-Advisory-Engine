import React, { useState, useEffect } from "react";

import ExecutiveSignals from "./sections/ExecutiveSignals";
import { Panel } from "./components/Panel";
import { KpiCard } from "./components/KpiCard";
import { BarRow } from "./components/BarRow";
import { SectionTitle } from "./components/SectionTitle";
import RegionSectorHeatmap from "./visualizations/RegionSectorHeatmap";
// import GlobalDemandMap from "./visualizations/GlobalDemandMap";
import UAEEmiratesMap from "./visualizations/UAEEmiratesMap";



import {
  formatInt,
  formatPct,
  safeNum,
  normalizeKey,
  topN
} from "./utils/formatters";

import { computeBaseScopeMatrix } from "./utils/aggregations";
/* =============================
TYPES
============================= */

type TopService = { service_id: string; click_count: number };

type DetailedLocation = {
  location_base: string | null; // Dubai | UAE | International
  emirate: string | null;
  country: string | null;
  scope: string | null; // Local | International
  region: string | null; // outbound region selection
  count: number;
};

type ActivityBreakdown = {
  activity_id: string;
  activity_name: string;
  sector: string;
  subsector: string;
  count: number;
};

type RegionDemand = { region: string; count: number };
type SectorDemand = { sector: string; count: number };
type SectorScopeDemand = { scope: string; sector: string; count: number };
type RegionSectorDemand = { region: string; sector: string; count: number };

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
  sector_scope_demand?: SectorScopeDemand[];
  region_sector_demand?: RegionSectorDemand[];
};

/* =============================
AGGREGATIONS (UI-only intelligence)
============================= */

function computeUaeEmiratesTable(detailed: DetailedLocation[]) {
  // UAE only, grouped by emirate with Local/International/Total
  const m = new Map<string, { emirate: string; Local: number; International: number; Total: number }>();

  for (const r of detailed || []) {
    if (normalizeKey(r.location_base) !== "UAE") continue;
    const emirate = normalizeKey(r.emirate || "Unknown");
    const scope = normalizeKey(r.scope);
    const c = safeNum(r.count);

    if (!m.has(emirate)) m.set(emirate, { emirate, Local: 0, International: 0, Total: 0 });

    const row = m.get(emirate)!;
    if (scope === "Local") row.Local += c;
    if (scope === "International") row.International += c;
    row.Total += c;
  }

  return [...m.values()].sort((a, b) => b.Total - a.Total);
}

function computeInternationalCountriesTable(detailed: DetailedLocation[]) {
  // International only, grouped by country with Local/International/Total
  const m = new Map<string, { country: string; Local: number; International: number; Total: number }>();

  for (const r of detailed || []) {
    if (normalizeKey(r.location_base) !== "International") continue;
    const country = normalizeKey(r.country);
    const scope = normalizeKey(r.scope);
    const c = safeNum(r.count);

    if (!m.has(country)) m.set(country, { country, Local: 0, International: 0, Total: 0 });

    const row = m.get(country)!;
    if (scope === "Local") row.Local += c;
    if (scope === "International") row.International += c;
    row.Total += c;
  }

  return [...m.values()].sort((a, b) => b.Total - a.Total);
}

function computeDubaiExpansionRegions(detailed: DetailedLocation[]) {
  // Dubai + scope=International → group by region
  const m = new Map<string, number>();

  for (const r of detailed || []) {
    if (normalizeKey(r.location_base) !== "Dubai") continue;
    if (normalizeKey(r.scope) !== "International") continue;

    const region = normalizeKey(r.region);
    const c = safeNum(r.count);

    m.set(region, (m.get(region) || 0) + c);
  }

  return [...m.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

function computeUaeExpansionRegions(detailed: DetailedLocation[]) {
  // UAE + scope=International → group by region
  const m = new Map<string, number>();

  for (const r of detailed || []) {
    if (normalizeKey(r.location_base) !== "UAE") continue;
    if (normalizeKey(r.scope) !== "International") continue;

    const region = normalizeKey(r.region);
    const c = safeNum(r.count);

    m.set(region, (m.get(region) || 0) + c);
  }

  return [...m.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRegionToSectorIndex(regionSector: RegionSectorDemand[]) {
  // { region: [{sector,count}...] }
  const m = new Map<string, { sector: string; count: number }[]>();
  for (const r of regionSector || []) {
    const region = normalizeKey(r.region);
    const sector = normalizeKey(r.sector);
    const count = safeNum(r.count);
    if (!m.has(region)) m.set(region, []);
    m.get(region)!.push({ sector, count });
  }
  for (const [k, arr] of m.entries()) {
    m.set(k, arr.sort((a, b) => b.count - a.count));
  }
  return m;
}

function buildSectorToActivitiesIndex(activityBreakdown: ActivityBreakdown[]) {
  // { sector: [{activity_id, activity_name, count}...] }

  const m = new Map<
    string,
    { activity_id: string; activity_name: string; count: number }[]
  >();

  for (const a of activityBreakdown || []) {
    const sector = normalizeKey(a.sector);
    const activity_id = normalizeKey(a.activity_id);
    const activity_name = a.activity_name;
    const count = safeNum(a.count);

    if (!m.has(sector)) m.set(sector, []);

    m.get(sector)!.push({
      activity_id,
      activity_name,
      count
    });
  }

  for (const [k, arr] of m.entries()) {
    m.set(
      k,
      arr.sort((x, y) => y.count - x.count)
    );
  }

  return m;
}

function buildExecutiveSignals(data: AnalyticsResponse) {
  const {
    top_services,
    sector_demand,
    activity_breakdown,
    region_demand,
    detailed_location
  } = data;

  const topService = top_services?.[0]?.service_id || "Unknown";
  const topSector = sector_demand?.[0]?.sector || "Unknown";
  const topActivity = activity_breakdown?.[0]?.activity_name || "Unknown";

  // Top outbound expansion region (Dubai + International)
  const dubaiRegions = detailed_location.filter(
    (r) =>
      normalizeKey(r.location_base) === "Dubai" &&
      normalizeKey(r.scope) === "International"
  );

  const regionMap = new Map<string, number>();
  dubaiRegions.forEach((r) => {
    const region = normalizeKey(r.region);
    regionMap.set(region, (regionMap.get(region) || 0) + safeNum(r.count));
  });

  const topRegion =
    [...regionMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  // Top inbound other emirate
  const emirateMap = new Map<string, number>();
  detailed_location.forEach((r) => {
    if (normalizeKey(r.location_base) !== "UAE") return;

    const emirate = normalizeKey(r.emirate);
    emirateMap.set(emirate, (emirateMap.get(emirate) || 0) + safeNum(r.count));
  });

  const topEmirate =
    [...emirateMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  // Top international inbound country
  const countryMap = new Map<string, number>();
  detailed_location.forEach((r) => {
    if (normalizeKey(r.location_base) !== "International") return;

    const country = normalizeKey(r.country);
    countryMap.set(country, (countryMap.get(country) || 0) + safeNum(r.count));
  });

  const topCountry =
    [...countryMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  return [
    { label: "Top service", value: topService },
    { label: "Top sector", value: topSector },
    { label: "Top activity", value: topActivity },
    { label: "Top expansion region", value: topRegion },
    { label: "Top other emirate", value: topEmirate },
    { label: "Top inbound country", value: topCountry }
  ];
}
/* =============================
DASHBOARD
============================= */

export default function AdminDashboard() {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Expandable activities under sectors: key = `${block}|${region}|${sector}`
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // Simple “view all” toggles
  const [showAllUaeEmirates, setShowAllUaeEmirates] = React.useState(false);
  const [showAllCountries, setShowAllCountries] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const adminKey = import.meta.env.VITE_ADMIN_KEY as string;

const res = await fetch(`/api/analytics?range=${range}`, {
  headers: { "x-admin-key": adminKey },
});

        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load analytics");
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
  }, [range]);

  if (loading) return <div className="p-10">Loading analytics…</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  if (!data) return null;

  const {
    kpis,
    top_services,
    detailed_location,
    activity_breakdown,
    region_demand,
    sector_demand,
    sector_scope_demand = [],
    region_sector_demand = [],
  } = data;
  const worldMapData = detailed_location;

const heatmapData = region_sector_demand.map((r) => ({
  region: r.region,
  sector: r.sector,
  count: r.count
}));

  const signals = buildExecutiveSignals(data);
  const sectorTrends = computeTrendSignals(
  sector_demand,
  sector_demand
).slice(0,5);
const momentumSectors = [...sector_demand]
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)
  .map((s) => ({
    label: s.sector,
    value: s.count
  }));


const momentumRegions = [...region_demand]
  .sort((a, b) => b.count - a.count)
  .slice(0, 5)
  .map((r) => ({
    label: r.region,
    value: r.count
  }));

  // Jurisdiction Matrix
  const baseMatrix = computeBaseScopeMatrix(detailed_location);

  // UAE Emirates table (conversion lens)
  const uaeEmirates = computeUaeEmiratesTable(detailed_location);
  const uaeHeatmapData = uaeEmirates.map((e) => ({
  emirate: e.emirate,
  Total: e.Total
}));
  const uaeEmiratesRows = (showAllUaeEmirates ? uaeEmirates : uaeEmirates.slice(0, 6));

  // International inbound countries
  const countries = computeInternationalCountriesTable(detailed_location);
  const countriesRows = (showAllCountries ? countries : countries.slice(0, 6));

// Disabled for simplified dashboard
// const dubaiExpansionRegions = computeDubaiExpansionRegions(detailed_location);
// const uaeExpansionRegions = computeUaeExpansionRegions(detailed_location);

  // Region → Sector (available, but NOT base-specific in current payload)
  const regionToSectors = buildRegionToSectorIndex(region_sector_demand);

  // Sector → Activities (available overall, not per-region)
  const sectorToActivities = buildSectorToActivitiesIndex(activity_breakdown);

  const TOP_REGIONS = 5;
  const TOP_SECTORS = 3;
  const TOP_ACTIVITIES = 5;

  function toggleExpand(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // helper: render Region → Sector with expandable activities
  function RegionSectorBlock({
    blockKey,
    title,
    subtitle,
    regions,
  }: {
    blockKey: string;
    title: string;
    subtitle: string;
    regions: { region: string; count: number }[];
  }) {
    const topRegions = regions.filter((r) => r.region !== "Unknown").slice(0, TOP_REGIONS);
    const max = topRegions[0]?.count || 1;

    return (
      <Panel title={title} subtitle={subtitle}>
        {topRegions.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-5">
            {topRegions.map((r) => {
              const sectors = (regionToSectors.get(normalizeKey(r.region)) || []).slice(0, TOP_SECTORS);

              return (
                <div key={r.region} className="rounded-xl border border-gray-100 p-4">
                  <div className="space-y-2">
                    <BarRow label={r.region} value={r.count} max={max} />
                    <div className="text-xs text-gray-500">
                      Top sectors shown for this region
                      <span className="text-gray-400"> (sector mapping is global in current payload)</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {sectors.length === 0 ? (
                      <div className="text-sm text-gray-500">No region→sector data yet.</div>
                    ) : (
                      sectors.map((s) => {
                        const k = `${blockKey}|${r.region}|${s.sector}`;
                        const isOpen = !!expanded[k];

                        const activities = (sectorToActivities.get(normalizeKey(s.sector)) || []).slice(0, TOP_ACTIVITIES);

                        return (
                          <div key={k} className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(k)}
                                    className="text-xs font-semibold text-[#003B5C] hover:underline shrink-0"
                                    aria-expanded={isOpen}
                                  >
                                    {isOpen ? "▼" : "▶"}
                                  </button>
                                  <div className="truncate text-sm font-semibold text-gray-900">
                                    {s.sector}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatInt(s.count)} demand signals
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleExpand(k)}
                                className="text-xs font-semibold text-[#003B5C] hover:underline"
                              >
                                {isOpen ? "Hide activities" : "View activities"}
                              </button>
                            </div>

                            {isOpen ? (
                              <div className="mt-3 rounded-lg bg-[#F7F9FC] p-3">
                                <div className="text-xs font-semibold text-gray-700">
                                  Top activities in this sector
                                  <span className="text-gray-400"> (overall; not region-specific yet)</span>
                                </div>
                                <div className="mt-2 space-y-2">
                                  {activities.length === 0 ? (
                                    <div className="text-sm text-gray-500">No activity data yet.</div>
                                  ) : (
activities.map((a) => (
  <div key={a.activity_id} className="flex justify-between text-sm">
    <span className="text-gray-700">
      {a.activity_name ?? `Activity ${a.activity_id}`}
    </span>
    <span className="font-semibold text-gray-900">
      {formatInt(a.count)}
    </span>
  </div>
))
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    );
  }

  // Sort some lists for visual quality
  const sectorOverallSorted = [...sector_demand].sort((a, b) => b.count - a.count).slice(0, 10);
  const regionDemandSorted = [...region_demand].sort((a, b) => b.count - a.count).slice(0, 10);
  const topServicesSorted = [...top_services].sort((a, b) => b.click_count - a.click_count).slice(0, 10);
const totalSubmissions =
  (baseMatrix.Dubai?.Total || 0) +
  (baseMatrix.UAE?.Total || 0) +
  (baseMatrix.International?.Total || 0);

  return (
    <div className="p-8 lg:p-10 space-y-12 bg-[#F7F9FC] min-h-screen">
{/* Header */}
<div className="flex items-end justify-between gap-6">
  <div>
    <div className="text-xs uppercase tracking-wider text-gray-500">
      Dubai Chambers • Advisory Engine
    </div>

    <h1 className="text-2xl lg:text-3xl font-semibold text-[#003B5C] mt-1">
      Executive Intelligence Dashboard
    </h1>

    <div className="text-sm text-gray-500 mt-2">
      Demand signals across Dubai, other UAE emirates, and international markets.
    </div>
  </div>

  {/* Time Range */}
  <div className="flex gap-2">
    <button
      onClick={() => setRange("7d")}
      className={`px-3 py-1 text-sm rounded-lg border ${
        range === "7d" ? "bg-[#003B5C] text-white" : "bg-white"
      }`}
    >
      7D
    </button>

    <button
      onClick={() => setRange("30d")}
      className={`px-3 py-1 text-sm rounded-lg border ${
        range === "30d" ? "bg-[#003B5C] text-white" : "bg-white"
      }`}
    >
      30D
    </button>

    <button
      onClick={() => setRange("all")}
      className={`px-3 py-1 text-sm rounded-lg border ${
        range === "all" ? "bg-[#003B5C] text-white" : "bg-white"
      }`}
    >
      ALL
    </button>
  </div>
</div>

{/* KPI Row */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard label="Results viewed" value={formatInt(kpis.results_viewed)} />
  <KpiCard label="Emails submitted" value={formatInt(kpis.email_submitted)} />
  <KpiCard label="Submit rate" value={formatPct(kpis.email_submit_rate)} />
  <KpiCard label="Click rate from viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
</div>

{/* Executive Signals */}
<ExecutiveSignals signals={signals} />

{/* Demand Momentum */}
<SectionTitle
  title="Demand momentum"
  subtitle="Signals of emerging growth across sectors and regions."
/>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  {sectorTrends.map((s) => (
    <div
      key={s.sector}
      className="flex justify-between items-center bg-white rounded-lg p-4 border"
    >
      <span className="font-medium text-gray-800">{s.sector}</span>

      <span
        className={`font-semibold ${
          s.change >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change).toFixed(1)}%
      </span>
    </div>
  ))}
</div>

  <Panel title="Total demand signals">
  <div className="text-4xl font-semibold text-[#003B5C]">
    {formatInt(totalSubmissions)}
  </div>
  <div className="text-sm text-gray-500 mt-2">
    Total advisory submissions across all jurisdictions
  </div>
</Panel>

      {/* Jurisdiction Snapshot */}
      <SectionTitle
        title="Jurisdiction snapshot"
        subtitle="Always separated: Dubai (core), UAE other emirates (conversion), International (inbound)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Dubai">
          <MiniStat label="Local" value={formatInt(baseMatrix.Dubai?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.Dubai?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.Dubai?.Total || 0)} />
        </Panel>

        <Panel title="UAE (Other Emirates)">
          <MiniStat label="Local" value={formatInt(baseMatrix.UAE?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.UAE?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.UAE?.Total || 0)} />
        </Panel>

        <Panel title="International (Inbound)">
          <MiniStat label="Local" value={formatInt(baseMatrix.International?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.International?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.International?.Total || 0)} />
        </Panel>
      </div>

      {/* UAE Conversion Intelligence */}
      <SectionTitle
        title="Other Emirates Demand"
        subtitle="Other emirates showing demand — a pipeline for Dubai Chambers membership conversion."
      />
      <Panel title="Demand by UAE emirate">
        {uaeEmiratesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {uaeEmiratesRows.map((r) => (
              <TableRow4
                key={r.emirate}
                a={r.emirate}
                b={formatInt(r.Local)}
                c={formatInt(r.International)}
                d={formatInt(r.Total)}
              />
            ))}
            {uaeEmirates.length > 6 ? (
              <Toggle expanded={showAllUaeEmirates} onClick={() => setShowAllUaeEmirates((v) => !v)} />
            ) : null}
          </div>
        )}
      </Panel>

<SectionTitle
  title="UAE emirate demand heatmap"
  subtitle="Demand signals across UAE emirates outside Dubai."
/>

<Panel title="UAE emirate demand intensity">
  <UAEEmiratesMap data={uaeHeatmapData} />
</Panel>

      {/* International Inbound Intelligence */}
     <SectionTitle
  title="International Demand"
  subtitle="Foreign businesses requesting advisory support related to Dubai."
/>
      <Panel title="International Demand by country">
        {countriesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {countriesRows.map((r) => (
              <TableRow4
                key={r.country}
                a={r.country}
                b={formatInt(r.Local)}
                c={formatInt(r.International)}
                d={formatInt(r.Total)}
              />
            ))}
            {countries.length > 6 ? (
              <Toggle expanded={showAllCountries} onClick={() => setShowAllCountries((v) => !v)} />
            ) : null}
          </div>
        )}
      </Panel>

{/*
<SectionTitle
  title="International demand map"
  subtitle="Global distribution of businesses interested in Dubai."
/>

<Panel title="Global demand map">
  <GlobalDemandMap data={worldMapData} />
</Panel>
*/}

{/*
<SectionTitle
  title="Expansion intelligence"
  subtitle="Option B: Region → Sector, with expandable activities (activities shown are sector-level overall until region-activity RPC is added)."
/>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <RegionSectorBlock
    blockKey="dubai-expansion"
    title="Dubai companies seeking expansion"
    subtitle="Filtered to Dubai + scope=International. Regions are Dubai-specific."
    regions={dubaiExpansionRegions}
  />

  <RegionSectorBlock
    blockKey="uae-expansion"
    title="UAE (other emirates) seeking expansion"
    subtitle="Filtered to UAE + scope=International. Regions are UAE-specific."
    regions={uaeExpansionRegions}
  />
</div>
*/}
<SectionTitle
  title="Region → Sector demand heatmap"
  subtitle="Visual intensity of sector demand by expansion region."
/>

<Panel title="Region sector demand matrix">
  <RegionSectorHeatmap data={heatmapData} />
</Panel>


  {/* Engagement */}
  <SectionTitle
    title="Engagement signals"
    subtitle="What users actually click and ask for."
  />

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <Panel title="Top clicked email services">
      {topServicesSorted.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
          {topServicesSorted.map((s) => (
            <Row key={s.service_id} label={s.service_id} value={formatInt(s.click_count)} />
          ))}
        </div>
      )}
    </Panel>

    <Panel title="Top activities (overall)">
      {activity_breakdown.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
{topN(activity_breakdown, 10, (a) => safeNum(a.count)).map((a) => (
  <Row
    key={a.activity_id}
    label={a.activity_name}
    value={formatInt(a.count)}
  />
))}
        </div>
      )}
    </Panel>
  </div>

  {/* Data note */}
  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <div className="text-sm font-semibold text-[#003B5C]">Data note</div>
    <div className="mt-2 text-sm text-gray-600 leading-relaxed">
      Region → Sector is supported by <span className="font-semibold">region_sector_demand</span>.
      Activities are expandable per sector using <span className="font-semibold">activity_breakdown</span>, which is currently{" "}
      <span className="font-semibold">not keyed by region/emirate/country</span>. When you add an RPC that returns
      <span className="font-semibold"> region + sector + activity_id</span> (and optionally location_base), the activity drill-down
      will become region-accurate with no UI redesign.
    </div>
  </div>
    </div>
  );
}

/* =============================
UI COMPONENTS
============================= */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-gray-100" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="pr-6 text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function TableRow4({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b py-2 text-sm">
      <div className="min-w-0 truncate text-gray-700">{a}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{b}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{c}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{d}</div>
    </div>
  );
}

function Toggle({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pt-2 text-sm font-semibold text-[#003B5C] hover:underline"
    >
      {expanded ? "Show less" : "View all"}
    </button>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}

