import React from "react";

type TopService = { service_id: string; click_count: number };

type DetailedLocation = {
  location_base: string | null; // Dubai | UAE | International
  emirate: string | null;       // e.g., Sharjah
  country: string | null;       // e.g., Argentina / AE
  scope: string | null;         // Local | International
  region: string | null;        // e.g., Africa (for outbound/expansion)
  count: number;
};

type ActivityBreakdown = {
  activity_id: string;
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

function formatInt(value: number) {
  return new Intl.NumberFormat().format(Number.isFinite(value) ? value : 0);
}
function formatPct(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}
function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function normalizeKey(s: any) {
  const v = String(s ?? "").trim();
  return v.length ? v : "Unknown";
}
function pctOf(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}
function top1<T>(rows: T[], getCount: (r: T) => number) {
  if (!rows || rows.length === 0) return null;
  return rows.reduce((best, r) => (getCount(r) > getCount(best) ? r : best), rows[0]);
}

/**
 * McKinsey-style insight bullets (management-first).
 * Pure UI aggregation from your existing arrays.
 */
function buildInsights(input: {
  kpis: Kpis;
  detailed_location: DetailedLocation[];
  sector_demand: SectorDemand[];
  region_demand: RegionDemand[];
  sector_scope_demand?: SectorScopeDemand[];
  region_sector_demand?: RegionSectorDemand[];
}) {
  const {
    kpis,
    detailed_location,
    sector_demand,
    region_demand,
    sector_scope_demand = [],
    region_sector_demand = [],
  } = input;

  const totalViewed = safeNum(kpis.results_viewed);

  // Totals by base (Dubai/UAE/International)
  const baseTotals = new Map<string, number>();
  for (const row of detailed_location || []) {
    const base = normalizeKey(row.location_base);
    baseTotals.set(base, (baseTotals.get(base) || 0) + safeNum(row.count));
  }
  const dubaiTotal = baseTotals.get("Dubai") || 0;
  const uaeTotal = baseTotals.get("UAE") || 0;
  const intlInboundTotal = baseTotals.get("International") || 0;

  // UAE top emirate
  const uaeEmirateTotals = new Map<string, number>();
  for (const row of detailed_location || []) {
    if (String(row.location_base) !== "UAE") continue;
    const em = normalizeKey(row.emirate);
    uaeEmirateTotals.set(em, (uaeEmirateTotals.get(em) || 0) + safeNum(row.count));
  }
  const uaeEmirateList = Array.from(uaeEmirateTotals.entries())
    .map(([emirate, count]) => ({ emirate, count }))
    .sort((a, b) => b.count - a.count);
  const topUaeEmirate = uaeEmirateList.find((x) => x.emirate !== "Unknown") || uaeEmirateList[0] || null;

  // International inbound top country
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

  const topRegion = top1(region_demand || [], (r) => safeNum((r as any).count));
  const topSector = top1(sector_demand || [], (r) => safeNum((r as any).count));

  const localSectorRows = sector_scope_demand.filter((r) => String(r.scope) === "Local");
  const intlSectorRows = sector_scope_demand.filter((r) => String(r.scope) === "International");
  const topLocalSector = top1(localSectorRows, (r) => safeNum((r as any).count));
  const topIntlSector = top1(intlSectorRows, (r) => safeNum((r as any).count));

  const topRegionSector = top1(region_sector_demand || [], (r) => safeNum((r as any).count));

  const bullets: { label: string; value: string }[] = [];

  if (dubaiTotal > 0) {
    bullets.push({
      label: "Dubai demand share",
      value: `${formatInt(dubaiTotal)} (${pctOf(dubaiTotal, totalViewed)})`,
    });
  }
  if (uaeTotal > 0 && topUaeEmirate) {
    bullets.push({
      label: "Top UAE emirate (outside Dubai)",
      value: `${topUaeEmirate.emirate} (${formatInt(topUaeEmirate.count)})`,
    });
  }
  if (intlInboundTotal > 0 && topIntlCountry) {
    bullets.push({
      label: "Top inbound country",
      value: `${topIntlCountry.country} (${formatInt(topIntlCountry.count)})`,
    });
  }
  if (topRegion && (topRegion as any).region) {
    bullets.push({
      label: "Top expansion region",
      value: `${(topRegion as any).region} (${formatInt(safeNum((topRegion as any).count))})`,
    });
  }
  if (topSector && (topSector as any).sector) {
    bullets.push({
      label: "Top sector overall",
      value: `${(topSector as any).sector} (${formatInt(safeNum((topSector as any).count))})`,
    });
  }
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
  if (topRegionSector && (topRegionSector as any).region && (topRegionSector as any).sector) {
    bullets.push({
      label: "Hottest Int’l combo",
      value: `${(topRegionSector as any).region} → ${(topRegionSector as any).sector} (${formatInt(
        safeNum((topRegionSector as any).count)
      )})`,
    });
  }

  return bullets.slice(0, 6);
}

function groupTotalsBy(
  rows: DetailedLocation[],
  filter: (r: DetailedLocation) => boolean,
  keyFn: (r: DetailedLocation) => string
) {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!filter(r)) continue;
    const k = normalizeKey(keyFn(r));
    m.set(k, (m.get(k) || 0) + safeNum(r.count));
  }
  return Array.from(m.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showAllTopServices, setShowAllTopServices] = React.useState(false);
  const [showAllActivities, setShowAllActivities] = React.useState(false);
  const [showAllSectorOverall, setShowAllSectorOverall] = React.useState(false);
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
    sector_scope_demand = [],
    region_sector_demand = [],
  } = data;

  const insights = buildInsights({
    kpis,
    detailed_location,
    sector_demand,
    region_demand,
    sector_scope_demand,
    region_sector_demand,
  });

  // --- Jurisdiction Intelligence (your “architecturally sound” view) ---
  // Dubai jurisdiction: only Dubai base
  const dubaiLocal = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "Dubai" && r.scope === "Local",
    () => "Local"
  )[0]?.count || 0;

  const dubaiIntl = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "Dubai" && r.scope === "International",
    () => "International"
  )[0]?.count || 0;

  // UAE other emirates
  const uaeLocal = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "UAE" && r.scope === "Local",
    () => "Local"
  )[0]?.count || 0;

  const uaeIntl = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "UAE" && r.scope === "International",
    () => "International"
  )[0]?.count || 0;

  const topEmirates = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "UAE" && r.scope === "Local",
    (r) => r.emirate
  ).slice(0, 5);

  // International inbound
  const intlLocal = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "International" && r.scope === "Local",
    () => "Local"
  )[0]?.count || 0;

  const intlIntl = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "International" && r.scope === "International",
    () => "International"
  )[0]?.count || 0;

  const topCountriesInbound = groupTotalsBy(
    detailed_location,
    (r) => r.location_base === "International",
    (r) => r.country
  ).slice(0, 6);

  const TOP = 10;

  const topServicesRows = showAllTopServices ? top_services : top_services.slice(0, TOP);
  const activityRows = showAllActivities ? activity_breakdown : activity_breakdown.slice(0, TOP);
  const sectorOverallRows = showAllSectorOverall ? sector_demand : sector_demand.slice(0, TOP);
  const sectorScopeRows = showAllSectorScope ? sector_scope_demand : sector_scope_demand.slice(0, TOP);
  const regionSectorRows = showAllRegionSector ? region_sector_demand : region_sector_demand.slice(0, TOP);

  return (
    <div className="p-8 space-y-10 bg-[#F7F9FC] min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">
            Dubai Chambers • Advisory Engine
          </div>
          <h1 className="text-2xl font-semibold text-[#003B5C] mt-1">
            Executive Intelligence Dashboard
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Demand signals across Dubai jurisdiction, UAE inbound, and global expansion.
          </div>
        </div>
      </div>

      {/* KPI Row (McKinsey-style: clean, compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Results Viewed" value={formatInt(kpis.results_viewed)} />
        <KpiCard label="Emails Submitted" value={formatInt(kpis.email_submitted)} />
        <KpiCard label="Submit Rate" value={formatPct(kpis.email_submit_rate)} />
        <KpiCard label="Click Rate from Viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
      </div>

      {/* Executive Insights strip */}
      <SectionTitle
        title="Executive insights"
        subtitle="Auto-generated highlights (what leadership reads first)."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.length === 0 ? (
          <div className="text-sm text-gray-500">No insights yet.</div>
        ) : (
          insights.map((ins, i) => (
            <InsightCard key={i} label={ins.label} value={ins.value} />
          ))
        )}
      </div>

      {/* Jurisdiction Intelligence */}
      <SectionTitle
        title="Jurisdiction intelligence"
        subtitle="Three lenses: Dubai (jurisdiction), UAE (other emirates), International (inbound)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Dubai (Jurisdiction)">
          <MiniStat label="Local" value={formatInt(dubaiLocal)} hint="Dubai-only jurisdiction support" />
          <MiniStat label="International" value={formatInt(dubaiIntl)} hint="Dubai companies seeking expansion" />
          <Divider />
          <div className="text-xs text-gray-500 leading-relaxed">
            Dubai should prioritize Dubai-only local support; international indicates Dubai firms seeking new markets.
          </div>
        </Panel>

        <Panel title="UAE (Other Emirates)">
          <MiniStat label="Local" value={formatInt(uaeLocal)} hint="Inbound support from other emirates" />
          <MiniStat label="International" value={formatInt(uaeIntl)} hint="Other emirates seeking global expansion" />
          <Divider />
          <div className="text-sm font-semibold text-[#003B5C]">Top emirates (Local)</div>
          <div className="mt-2 space-y-2">
            {topEmirates.length ? (
              topEmirates.map((r, i) => (
                <BarRow
                  key={i}
                  label={r.key}
                  value={r.count}
                  max={topEmirates[0].count}
                />
              ))
            ) : (
              <Empty />
            )}
          </div>
        </Panel>

        <Panel title="International (Inbound)">
          <MiniStat label="Local" value={formatInt(intlLocal)} hint="Interest in Dubai membership/services" />
          <MiniStat label="International" value={formatInt(intlIntl)} hint="Global expansion intent + target region" />
          <Divider />
          <div className="text-sm font-semibold text-[#003B5C]">Top countries (Inbound)</div>
          <div className="mt-2 space-y-2">
            {topCountriesInbound.length ? (
              topCountriesInbound.map((r, i) => (
                <BarRow
                  key={i}
                  label={r.key}
                  value={r.count}
                  max={topCountriesInbound[0].count}
                />
              ))
            ) : (
              <Empty />
            )}
          </div>
        </Panel>
      </div>

      {/* Global Expansion Signals */}
      <SectionTitle
        title="Global expansion signals"
        subtitle="Outbound demand: where companies want to expand (regions) and which sectors lead."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Top expansion regions">
          {region_demand.length ? (
            <div className="space-y-2">
              {region_demand.slice(0, 8).map((r, i) => (
                <BarRow key={i} label={r.region} value={r.count} max={region_demand[0]?.count || 1} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
          <PanelFooterNote note="This is the “heatmap replacement”: regions first, not countries." />
        </Panel>

        <Panel title="International demand: Region → Sector">
          {regionSectorRows.length ? (
            <div className="space-y-2">
              {regionSectorRows.map((r, i) => (
                <Row key={i} label={`${r.region} → ${r.sector}`} value={formatInt(r.count)} />
              ))}
              {region_sector_demand.length > TOP && (
                <Toggle expanded={showAllRegionSector} onClick={() => setShowAllRegionSector((v) => !v)} />
              )}
            </div>
          ) : (
            <Empty />
          )}
          <PanelFooterNote note="This tells you the ‘why’ behind the region demand." />
        </Panel>

        <Panel title="Sector demand by scope">
          {sectorScopeRows.length ? (
            <div className="space-y-2">
              {sectorScopeRows.map((r, i) => (
                <Row key={i} label={`${r.scope} → ${r.sector}`} value={formatInt(r.count)} />
              ))}
              {sector_scope_demand.length > TOP && (
                <Toggle expanded={showAllSectorScope} onClick={() => setShowAllSectorScope((v) => !v)} />
              )}
            </div>
          ) : (
            <Empty />
          )}
          <PanelFooterNote note="This is your best ‘Local vs International’ policy signal." />
        </Panel>
      </div>

      {/* Demand Drivers */}
      <SectionTitle
        title="Demand drivers"
        subtitle="What users engage with: services clicked, sectors, and top activities."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel
          title="Top clicked email services"
          footer={
            top_services.length > TOP ? (
              <Toggle expanded={showAllTopServices} onClick={() => setShowAllTopServices((v) => !v)} />
            ) : null
          }
        >
          {topServicesRows.length ? (
            topServicesRows.map((s, i) => (
              <Row key={s.service_id} label={`${i + 1}. ${s.service_id}`} value={formatInt(s.click_count)} />
            ))
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel
          title="Top activities & subsectors"
          footer={
            activity_breakdown.length > TOP ? (
              <Toggle expanded={showAllActivities} onClick={() => setShowAllActivities((v) => !v)} />
            ) : null
          }
        >
          {activityRows.length ? (
            activityRows.map((a, i) => (
              <Row key={i} label={`${a.sector} → ${a.subsector}`} value={formatInt(a.count)} />
            ))
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel
          title="Sector demand (overall)"
          footer={
            sector_demand.length > TOP ? (
              <Toggle expanded={showAllSectorOverall} onClick={() => setShowAllSectorOverall((v) => !v)} />
            ) : null
          }
        >
          {sectorOverallRows.length ? (
            <div className="space-y-2">
              {sectorOverallRows.map((s, i) => (
                <BarRow key={i} label={s.sector} value={s.count} max={sectorOverallRows[0]?.count || 1} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      {/* Raw location panel (optional) */}
      <div className="pt-2">
        <details className="rounded-2xl border bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-[#003B5C]">
            Debug view: raw Location & Scope breakdown (collapsed)
          </summary>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Raw rows (first 30)">
              {(detailed_location || []).slice(0, 30).map((row, i) => {
                const parts = [row.location_base, row.emirate, row.country, row.scope, row.region].filter(Boolean);
                return <Row key={i} label={parts.join(" → ")} value={formatInt(row.count)} />;
              })}
            </Panel>
            <Panel title="Notes">
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2">
                <li>
                  “Unknown” values mean the UI sent null (not a blocker for management; just incomplete tracking).
                </li>
                <li>
                  If you want a true country heatmap later, you’ll need ISO codes and/or a map library.
                </li>
              </ul>
            </Panel>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ---------- UI Components ---------- */

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">{title}</div>
      {subtitle ? <div className="text-sm text-gray-600 mt-1">{subtitle}</div> : null}
    </div>
  );
}

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
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#003B5C]">{title}</h2>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="pr-6 text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
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
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
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

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      </div>
      <div className="text-xl font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-gray-100" />;
}

function PanelFooterNote({ note }: { note: string }) {
  return <div className="pt-4 text-xs text-gray-500">{note}</div>;
}

/**
 * McKinsey-ish “bar row” (no charts needed).
 * Clean, scannable magnitude visual.
 */
function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
      <div className="min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate text-gray-700">{label}</span>
          <span className="ml-3 font-semibold text-gray-900">{formatInt(value)}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-[#003B5C]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-xs text-gray-400 w-10 text-right">{Math.round(pct)}%</div>
    </div>
  );
}