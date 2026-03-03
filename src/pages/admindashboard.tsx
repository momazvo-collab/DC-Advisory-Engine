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

  if (loading) {
    return <div className="p-8">Loading analytics…</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!data) return null;

  const { kpis, top_services, detailed_location } = data;

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

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Clicked Services */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Top Clicked Email Services
          </h2>

          {top_services.length === 0 && (
            <div className="text-sm text-gray-500">
              No click data yet.
            </div>
          )}

          {top_services.map((service, i) => (
            <div
              key={service.service_id}
              className="flex justify-between py-2 border-b text-sm"
            >
              <span>{i + 1}. {service.service_id}</span>
              <span className="font-semibold">
                {formatInt(service.click_count)}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Location + Scope Breakdown */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Location & Scope Breakdown
          </h2>

          {detailed_location.length === 0 && (
            <div className="text-sm text-gray-500">
              No location data yet.
            </div>
          )}

          {detailed_location.map((row, i) => {
            const labelParts = [
              row.location_base,
              row.emirate,
              row.country,
              row.scope,
              row.region,
            ].filter(Boolean);

            return (
              <div
                key={i}
                className="flex justify-between py-2 border-b text-sm"
              >
                <span>{labelParts.join(" → ")}</span>
                <span className="font-semibold">
                  {formatInt(row.count)}
                </span>
              </div>
            );
          })}
        </div>

      </div>
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