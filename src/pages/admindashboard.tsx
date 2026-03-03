import React from "react";

type TopService = {
  service_id: string;
  click_count: number;
};

type DetailedLocation = {
  location_label: string;
  count: number;
};

type AnalyticsResponse = {
  results_viewed: number;
  email_submitted: number;
  email_link_clicked: number;
  email_submit_rate: number;
  email_click_rate_from_submitted: number;
  email_click_rate_from_viewed: number;
  top_services: TopService[];
  detailed_location: DetailedLocation[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorMessage(payload: unknown): string | null {
  if (!isObject(payload)) return null;
  const err = payload.error;
  return typeof err === "string" && err.trim() ? err : null;
}

function formatInt(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPct(value: number) {
  const n = Number.isFinite(value) ? value : 0;
  return `${(n * 100).toFixed(1)}%`;
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const adminKey = import.meta.env.VITE_ADMIN_KEY as string | undefined;

        if (!adminKey) {
          throw new Error("Missing VITE_ADMIN_KEY");
        }

        const resp = await fetch("/api/analytics", {
          method: "GET",
          headers: {
            "x-admin-key": adminKey,
          },
        });

        const raw = (await resp.json().catch(() => null)) as unknown;

        if (!resp.ok) {
          const msg =
            parseErrorMessage(raw) ??
            `Request failed (${resp.status})`;
          throw new Error(msg);
        }

        if (!isObject(raw)) {
          throw new Error("Invalid analytics response");
        }

        if (!cancelled) {
          setData(raw as AnalyticsResponse);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Failed to load analytics"
          );
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
    return (
      <div className="p-6 sm:p-10">
        <div className="text-sm text-gray-600">
          Loading analytics…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-10">
        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="text-sm font-semibold text-red-700">
            Failed to load analytics
          </div>
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 sm:p-10">
        <div className="text-sm text-gray-600">
          No data available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <h1 className="text-2xl font-semibold mb-8 text-[#003B5C]">
        Advisory Engine Analytics
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Results Viewed"
          value={formatInt(data.results_viewed)}
        />
        <KpiCard
          label="Emails Submitted"
          value={formatInt(data.email_submitted)}
        />
        <KpiCard
          label="Submit Rate"
          value={formatPct(data.email_submit_rate)}
        />
        <KpiCard
          label="Click Rate from Viewed"
          value={formatPct(data.email_click_rate_from_viewed)}
        />
      </div>

      {/* ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Clicked Services */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#003B5C] mb-4">
            Top Clicked Email Services
          </h2>

          {data.top_services?.length === 0 && (
            <div className="text-sm text-gray-500">
              No email click data yet.
            </div>
          )}

          {data.top_services?.map((service, index) => (
            <div
              key={service.service_id}
              className="flex justify-between py-2 border-b text-sm"
            >
              <span>
                {index + 1}. {service.service_id}
              </span>
              <span className="font-semibold">
                {formatInt(service.click_count)}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Location Breakdown */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#003B5C] mb-4">
            Detailed Location Breakdown
          </h2>

          {data.detailed_location?.length === 0 && (
            <div className="text-sm text-gray-500">
              No location data yet.
            </div>
          )}

          {data.detailed_location?.map((loc) => (
            <div
              key={loc.location_label}
              className="flex justify-between py-2 border-b text-sm"
            >
              <span>{loc.location_label}</span>
              <span className="font-semibold">
                {formatInt(loc.count)}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[#003B5C]">
        {value}
      </div>
    </div>
  );
}