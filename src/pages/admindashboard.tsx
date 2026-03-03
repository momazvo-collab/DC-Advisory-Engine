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
  } = data;

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
        <KpiCard label="Click Rate from Viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
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
        <Panel title="Location & Scope Breakdown">
          {detailed_location.length === 0 && <Empty />}
          {detailed_location.map((row, i) => {
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
            <Row
              key={i}
              label={row.region}
              value={formatInt(row.count)}
            />
          ))}
        </Panel>

        {/* Sector Demand */}
        <Panel title="Sector Demand">
          {sector_demand.length === 0 && <Empty />}
          {sector_demand.map((row, i) => (
            <Row
              key={i}
              label={row.sector}
              value={formatInt(row.count)}
            />
          ))}
        </Panel>

      </div>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function Panel({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-sm text-gray-500">
      No data yet.
    </div>
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