import React, { useEffect, useState } from "react";

import { formatInt, formatPct, safeNum, topN } from "../dashboard/utils/formatters";

import OverviewSection from "./sections/OverviewSection";
import DemandSection from "./sections/DemandSection";
import EngagementSection from "./sections/EngagementSection";

import {
  buildExecutiveSignals,
  computeBaseScopeMatrix,
  computeInternationalCountriesTable,
  computeUaeEmiratesTable,
  type AnalyticsResponse,
} from "./intelligence/demandAggregations";

export default function AdminDashboard() {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  const { kpis, top_services, detailed_location, activity_breakdown, region_demand, sector_demand, region_sector_demand = [] } =
    data;

  const signals = buildExecutiveSignals(data);

  const baseMatrix = computeBaseScopeMatrix(detailed_location);

  const uaeEmirates = computeUaeEmiratesTable(detailed_location);
  const uaeEmiratesRows = showAllUaeEmirates ? uaeEmirates : uaeEmirates.slice(0, 6);
  const uaeHeatmapData = uaeEmirates.map((e) => ({ emirate: e.emirate, Total: e.Total }));

  const countries = computeInternationalCountriesTable(detailed_location);
  const countriesRows = showAllCountries ? countries : countries.slice(0, 6);

  const heatmapData = region_sector_demand.map((r) => ({
    region: r.region,
    sector: r.sector,
    count: r.count,
  }));

  const totalSubmissions =
    (baseMatrix.Dubai?.Total || 0) + (baseMatrix.UAE?.Total || 0) + (baseMatrix.International?.Total || 0);

  const topServicesSorted = [...top_services].sort((a, b) => b.click_count - a.click_count).slice(0, 10);

  return (
    <div className="p-8 lg:p-10 space-y-12 bg-[#F7F9FC] min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">Dubai Chambers • Advisory Engine</div>

          <h1 className="text-2xl lg:text-3xl font-semibold text-[#003B5C] mt-1">Executive Intelligence Dashboard</h1>

          <div className="text-sm text-gray-500 mt-2">
            Demand signals across Dubai, other UAE emirates, and international markets.
          </div>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          <button
            onClick={() => setRange("7d")}
            className={`px-3 py-1 text-sm rounded-lg border ${range === "7d" ? "bg-[#003B5C] text-white" : "bg-white"}`}
          >
            7D
          </button>

          <button
            onClick={() => setRange("30d")}
            className={`px-3 py-1 text-sm rounded-lg border ${range === "30d" ? "bg-[#003B5C] text-white" : "bg-white"}`}
          >
            30D
          </button>

          <button
            onClick={() => setRange("all")}
            className={`px-3 py-1 text-sm rounded-lg border ${range === "all" ? "bg-[#003B5C] text-white" : "bg-white"}`}
          >
            ALL
          </button>
        </div>
      </div>

      <OverviewSection
        kpis={kpis}
        baseMatrix={baseMatrix}
        signals={signals}
        totalSubmissions={totalSubmissions}
        formatInt={formatInt}
        formatPct={formatPct}
      />

      <DemandSection
        uaeEmiratesRows={uaeEmiratesRows}
        uaeEmirates={uaeEmirates}
        showAllUaeEmirates={showAllUaeEmirates}
        setShowAllUaeEmirates={setShowAllUaeEmirates}
        uaeHeatmapData={uaeHeatmapData}
        countriesRows={countriesRows}
        countries={countries}
        showAllCountries={showAllCountries}
        setShowAllCountries={setShowAllCountries}
        heatmapData={heatmapData}
        formatInt={formatInt}
      />

      <EngagementSection
        topServicesSorted={topServicesSorted}
        activityBreakdown={activity_breakdown}
        formatInt={formatInt}
        topN={topN}
        safeNum={safeNum}
      />
    </div>
  );
}
