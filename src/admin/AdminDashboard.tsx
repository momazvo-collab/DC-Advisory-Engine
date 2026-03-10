import React, { useEffect, useState } from "react";

import { formatInt, formatPct, safeNum, topN } from "../dashboard/utils/formatters";

import OverviewSection from "./sections/OverviewSection";
import DemandSection from "./sections/DemandSection";
import EngagementSection from "./sections/EngagementSection";

import {
  buildExecutiveSignals,
  computeBaseScopeMatrix,
  type AnalyticsResponse,
} from "./intelligence/demandAggregations";

export default function AdminDashboard() {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  const { kpis, top_services, detailed_location, activity_breakdown, sector_demand } = data;

  const signals = buildExecutiveSignals(data);

  const baseMatrix = computeBaseScopeMatrix(detailed_location);

  const overallTotals = {
    total: (baseMatrix.Dubai?.Total || 0) + (baseMatrix.UAE?.Total || 0) + (baseMatrix.International?.Total || 0),
    local:
      (baseMatrix.Dubai?.Local || 0) + (baseMatrix.UAE?.Local || 0) + (baseMatrix.International?.Local || 0),
    international:
      (baseMatrix.Dubai?.International || 0) +
      (baseMatrix.UAE?.International || 0) +
      (baseMatrix.International?.International || 0),
  };

  const jurisdictionTotals = {
    Dubai: {
      total: baseMatrix.Dubai?.Total || 0,
      local: baseMatrix.Dubai?.Local || 0,
      international: baseMatrix.Dubai?.International || 0,
    },
    OtherEmirates: {
      total: baseMatrix.UAE?.Total || 0,
      local: baseMatrix.UAE?.Local || 0,
      international: baseMatrix.UAE?.International || 0,
    },
    International: {
      total: baseMatrix.International?.Total || 0,
      local: baseMatrix.International?.Local || 0,
      international: baseMatrix.International?.International || 0,
    },
  };

  const topOverallSector = sector_demand?.length
    ? sector_demand.reduce(
        (best, row) => (safeNum(row.count) > safeNum(best.count) ? row : best),
        sector_demand[0]
      )
    : null;

  const topOverallActivity = activity_breakdown?.length
    ? activity_breakdown.reduce(
        (best, row) => (safeNum(row.count) > safeNum(best.count) ? row : best),
        activity_breakdown[0]
      )
    : null;

  const overallTopSectors = topN(sector_demand || [], 10, (s) => safeNum(s.count));
  const overallTopActivities = topN(activity_breakdown || [], 10, (a) => safeNum(a.count));

  const countrySet = new Set<string>();
  const emirateTotalsByScope: Record<string, { total: number; local: number; international: number }> = {
    All: { total: 0, local: 0, international: 0 },
  };
  const countryTotalsByScope: Record<string, { total: number; local: number; international: number }> = {
    "All Countries": { total: 0, local: 0, international: 0 },
  };
  const regionTotalsInternational: Record<string, number> = {};

  const normalize = (v: any) => {
    const s = String(v ?? "").trim();
    return s.length ? s : "Unknown";
  };

  const normalizeEmirate = (v: any) => {
    const raw = normalize(v);
    const key = raw.toLowerCase();
    if (key === "rak" || key === "ras al khaimah" || key === "ras al-khaimah") return "Ras Al Khaimah";
    if (key === "uaq" || key === "umm al quwain" || key === "umm al-quwain") return "Umm Al Quwain";
    if (key === "abudhabi" || key === "abu-dhabi" || key === "abu dhabi") return "Abu Dhabi";
    return raw;
  };

  for (const r of detailed_location || []) {
    const locationBase = normalize(r.location_base);
    const scope = normalize(r.scope);
    const count = safeNum(r.count);

    if (locationBase === "International") {
      const country = normalize(r.country);
      if (country !== "Unknown") countrySet.add(country);

      const bucketKey = country === "Unknown" ? "Unknown" : country;
      if (!countryTotalsByScope[bucketKey]) {
        countryTotalsByScope[bucketKey] = { total: 0, local: 0, international: 0 };
      }
      countryTotalsByScope[bucketKey].total += count;
      countryTotalsByScope["All Countries"].total += count;
      if (scope === "Local") {
        countryTotalsByScope[bucketKey].local += count;
        countryTotalsByScope["All Countries"].local += count;
      }
      if (scope === "International") {
        countryTotalsByScope[bucketKey].international += count;
        countryTotalsByScope["All Countries"].international += count;

        const region = normalize(r.region);
        if (region !== "Unknown") {
          regionTotalsInternational[region] = (regionTotalsInternational[region] || 0) + count;
        }
      }
    }

    if (locationBase === "UAE") {
      const emirate = normalizeEmirate(r.emirate);
      const bucketKey = emirate === "Unknown" ? "Unknown" : emirate;
      if (!emirateTotalsByScope[bucketKey]) {
        emirateTotalsByScope[bucketKey] = { total: 0, local: 0, international: 0 };
      }
      emirateTotalsByScope[bucketKey].total += count;
      emirateTotalsByScope.All.total += count;
      if (scope === "Local") {
        emirateTotalsByScope[bucketKey].local += count;
        emirateTotalsByScope.All.local += count;
      }
      if (scope === "International") {
        emirateTotalsByScope[bucketKey].international += count;
        emirateTotalsByScope.All.international += count;
      }
    }
  }

  const countryOptions = [...countrySet].sort((a, b) => a.localeCompare(b));

  const internationalTopRegionsAll = Object.entries(regionTotalsInternational)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topOverallRegion = internationalTopRegionsAll[0] || null;

  const totalSubmissions = overallTotals.total;

  const topServicesSorted = [...top_services].sort((a, b) => b.click_count - a.click_count).slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <div className="max-w-7xl mx-auto p-8 lg:p-10 space-y-12">
        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">Dubai Chambers • Advisory Engine</div>

            <h1 className="text-2xl lg:text-3xl font-semibold text-[#003B5C] mt-1">Intelligence Dashboard</h1>
          </div>

          {/* Time Range */}
          <div className="flex gap-2">
            <button
              onClick={() => setRange("7d")}
              className={`px-3 py-1 text-sm rounded-lg border border-[#E6ECF2] ${
                range === "7d" ? "bg-[#003B5C] text-white" : "bg-white text-gray-700"
              }`}
            >
              7D
            </button>

            <button
              onClick={() => setRange("30d")}
              className={`px-3 py-1 text-sm rounded-lg border border-[#E6ECF2] ${
                range === "30d" ? "bg-[#003B5C] text-white" : "bg-white text-gray-700"
              }`}
            >
              30D
            </button>

            <button
              onClick={() => setRange("all")}
              className={`px-3 py-1 text-sm rounded-lg border border-[#E6ECF2] ${
                range === "all" ? "bg-[#003B5C] text-white" : "bg-white text-gray-700"
              }`}
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
          overallTotals={overallTotals}
          topOverallSector={topOverallSector}
          topOverallActivity={topOverallActivity}
          topOverallRegion={topOverallRegion}
          jurisdictionTotals={jurisdictionTotals}
          countryOptions={countryOptions}
          emirateTotalsByScope={emirateTotalsByScope}
          countryTotalsByScope={countryTotalsByScope}
          internationalTopRegionsAll={internationalTopRegionsAll}
          overallTopSectors={overallTopSectors}
          overallTopActivities={overallTopActivities}
          formatInt={formatInt}
        />

        <EngagementSection
          kpis={kpis}
          topServicesSorted={topServicesSorted}
          activityBreakdown={activity_breakdown}
          formatInt={formatInt}
          topN={topN}
          safeNum={safeNum}
        />
      </div>
    </div>
  );
}
