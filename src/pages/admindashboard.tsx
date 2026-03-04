import React from "react";

/* =============================
TYPES
============================= */

type TopService = { service_id: string; click_count: number };

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
UTILS
============================= */

function formatInt(v: number) {
  return new Intl.NumberFormat().format(Number.isFinite(v) ? v : 0);
}

function formatPct(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `${(n * 100).toFixed(1)}%`;
}

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function pctOf(part: number, total: number) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

/* =============================
EXECUTIVE INSIGHT GENERATOR
============================= */

function buildInsights(data: AnalyticsResponse) {
  const { kpis, detailed_location, sector_demand, region_demand } = data;

  const total = safeNum(kpis.results_viewed);

  const dubaiDemand = detailed_location
    .filter((r) => r.location_base === "Dubai")
    .reduce((sum, r) => sum + safeNum(r.count), 0);

  const topSector =
    [...sector_demand].sort((a, b) => b.count - a.count)[0]?.sector || "Unknown";

  const topRegion =
    [...region_demand].sort((a, b) => b.count - a.count)[0]?.region || "Unknown";

  return [
    `Dubai accounts for ${pctOf(dubaiDemand, total)} of advisory demand.`,
    `${topSector} is currently the most requested sector.`,
    `${topRegion} appears as the leading international expansion region.`,
    `${formatInt(total)} advisory sessions have been generated so far.`,
  ];
}

/* =============================
MAIN DASHBOARD
============================= */

export default function AdminDashboard() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const adminKey = import.meta.env.VITE_ADMIN_KEY;

        const res = await fetch("/api/analytics", {
          headers: { "x-admin-key": adminKey },
        });

        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to load analytics");

        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const insights = buildInsights(data);

  return (
    <div className="p-10 space-y-12 bg-[#F7F9FC] min-h-screen">

      {/* HEADER */}

      <div>
        <div className="text-xs uppercase text-gray-500 tracking-wider">
          Dubai Chambers
        </div>

        <h1 className="text-3xl font-semibold text-[#003B5C] mt-2">
          Advisory Engine Intelligence Dashboard
        </h1>

        <div className="text-sm text-gray-500 mt-2">
          Strategic signals from advisory demand across Dubai, UAE and global expansion.
        </div>
      </div>

      {/* KPI ROW */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <KpiCard label="Results Viewed" value={formatInt(kpis.results_viewed)} />

        <KpiCard label="Emails Submitted" value={formatInt(kpis.email_submitted)} />

        <KpiCard label="Submit Rate" value={formatPct(kpis.email_submit_rate)} />

        <KpiCard label="Click Rate" value={formatPct(kpis.email_click_rate_from_viewed)} />

      </div>

      {/* EXECUTIVE SIGNALS */}

      <Section title="Key Signals">

        <div className="grid md:grid-cols-2 gap-6">

          {insights.map((text, i) => (
            <InsightCard key={i} text={text} />
          ))}

        </div>

      </Section>

      {/* GEOGRAPHY */}

      <Section title="Geographic Demand Intelligence">

        <div className="grid lg:grid-cols-3 gap-6">

          <Panel title="Dubai Jurisdiction">

            {detailed_location
              .filter((r) => r.location_base === "Dubai")
              .map((r, i) => (
                <Row
                  key={i}
                  label={r.scope || "Unknown"}
                  value={formatInt(r.count)}
                />
              ))}

          </Panel>

          <Panel title="UAE Inbound">

            {[...detailed_location]
              .filter((r) => r.location_base === "UAE")
              .slice(0, 6)
              .map((r, i) => (
                <Row
                  key={i}
                  label={r.emirate || "Unknown"}
                  value={formatInt(r.count)}
                />
              ))}

          </Panel>

          <Panel title="International Inbound">

            {[...detailed_location]
              .filter((r) => r.location_base === "International")
              .slice(0, 6)
              .map((r, i) => (
                <Row
                  key={i}
                  label={r.country || "Unknown"}
                  value={formatInt(r.count)}
                />
              ))}

          </Panel>

        </div>

      </Section>

      {/* MARKET DEMAND */}

      <Section title="Market Demand Signals">

        <div className="grid lg:grid-cols-3 gap-6">

          <Panel title="Top Sectors">

            {[...sector_demand]
              .sort((a, b) => b.count - a.count)
              .map((s, i) => (
                <BarRow
                  key={i}
                  label={s.sector}
                  value={s.count}
                  max={sector_demand[0]?.count || 1}
                />
              ))}

          </Panel>

          <Panel title="Sector by Scope">

            {sector_scope_demand.map((s, i) => (
              <Row
                key={i}
                label={`${s.scope} → ${s.sector}`}
                value={formatInt(s.count)}
              />
            ))}

          </Panel>

          <Panel title="Region → Sector Demand">

            {region_sector_demand.map((r, i) => (
              <Row
                key={i}
                label={`${r.region} → ${r.sector}`}
                value={formatInt(r.count)}
              />
            ))}

          </Panel>

        </div>

      </Section>

      {/* USER ENGAGEMENT */}

      <Section title="User Engagement Signals">

        <div className="grid lg:grid-cols-2 gap-6">

          <Panel title="Top Clicked Email Services">

            {top_services.map((s, i) => (
              <Row
                key={i}
                label={s.service_id}
                value={formatInt(s.click_count)}
              />
            ))}

          </Panel>

          <Panel title="Top Activities">

            {activity_breakdown.map((a, i) => (
              <Row
                key={i}
                label={`${a.sector} → ${a.subsector}`}
                value={formatInt(a.count)}
              />
            ))}

          </Panel>

        </div>

      </Section>

    </div>
  );
}

/* =============================
UI COMPONENTS
============================= */

function Section({ title, children }: any) {
  return (
    <div className="pt-6 border-t border-gray-100">
      <div className="text-sm font-semibold text-[#003B5C] mb-4">{title}</div>
      {children}
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-white p-7 shadow-sm">
      <h2 className="text-sm font-semibold text-[#003B5C] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function KpiCard({ label, value }: any) {
  return (
    <div className="rounded-2xl border bg-white p-7 shadow-sm">
      <div className="text-xs uppercase text-gray-500 tracking-wide">{label}</div>
      <div className="text-3xl font-semibold text-[#003B5C] mt-2">{value}</div>
    </div>
  );
}

function InsightCard({ text }: any) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-gray-700">
      {text}
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function BarRow({ label, value, max }: any) {
  const pct = max ? (value / max) * 100 : 0;

  return (
    <div className="mb-3">

      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full mt-1">

        <div
          className="h-2 bg-[#003B5C] rounded-full"
          style={{ width: `${pct}%` }}
        />

      </div>

    </div>
  );
}