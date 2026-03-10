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

type ScopeBreakdown<T> = {
  local: T[];
  international: T[];
};

type RankingItem = { label: string; count: number };

type GeographyRankings = {
  Dubai: ScopeBreakdown<RankingItem>;
  OtherEmirates: ScopeBreakdown<RankingItem>;
  International: ScopeBreakdown<RankingItem>;
  emirates: Record<string, ScopeBreakdown<RankingItem>>;
  countries: Record<string, ScopeBreakdown<RankingItem>>;
};

type RegionRankings = {
  Dubai: RankingItem[];
  OtherEmirates: RankingItem[];
  International: RankingItem[];
  countries: Record<string, RankingItem[]>;
};

type CountryRankings = {
  local: RankingItem[];
  international: RankingItem[];
};

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

  const { kpis, top_services, detailed_location, activity_breakdown, sector_demand, region_sector_activity_demand } = data;

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

  const toTopRankings = (counts: Record<string, number>): RankingItem[] =>
    Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .filter((row) => row.label !== "Unknown" && row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

  const createScopeCounters = () => ({
    local: {} as Record<string, number>,
    international: {} as Record<string, number>,
  });

  const createRegionCounter = () => ({ international: {} as Record<string, number> });

  const sectorCounters = {
    Dubai: createScopeCounters(),
    OtherEmirates: createScopeCounters(),
    International: createScopeCounters(),
    emirates: {} as Record<string, ReturnType<typeof createScopeCounters>>,
    countries: {} as Record<string, ReturnType<typeof createScopeCounters>>,
  };

  const activityCounters = {
    Dubai: createScopeCounters(),
    OtherEmirates: createScopeCounters(),
    International: createScopeCounters(),
    emirates: {} as Record<string, ReturnType<typeof createScopeCounters>>,
    countries: {} as Record<string, ReturnType<typeof createScopeCounters>>,
  };

  const regionCounters = {
    Dubai: createRegionCounter(),
    OtherEmirates: createRegionCounter(),
    International: createRegionCounter(),
    countries: {} as Record<string, ReturnType<typeof createRegionCounter>>,
  };

  const addCount = (bucket: Record<string, number>, label: string, count: number) => {
    if (!label || label === "Unknown" || count <= 0) return;
    bucket[label] = (bucket[label] || 0) + count;
  };

  const addScopedRanking = (
    target: ReturnType<typeof createScopeCounters>,
    scope: string,
    label: string,
    count: number
  ) => {
    if (scope === "Local") addCount(target.local, label, count);
    if (scope === "International") addCount(target.international, label, count);
  };

  const activityById = new Map<string, { activity_name: string; sector: string }>();
  for (const a of activity_breakdown || []) {
    const id = String(a.activity_id ?? "").trim();
    if (id) {
      activityById.set(id, {
        activity_name: String(a.activity_name ?? id).trim(),
        sector: String(a.sector ?? "").trim(),
      });
    }
  }

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
        if (!regionCounters.countries[bucketKey]) {
          regionCounters.countries[bucketKey] = createRegionCounter();
        }
        addCount(regionCounters.countries[bucketKey].international, normalize(r.region), count);
        addCount(regionCounters.International.international, normalize(r.region), count);
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
        addCount(regionCounters.OtherEmirates.international, normalize(r.region), count);
      }
    }

    if (locationBase === "Dubai" && scope === "International") {
      addCount(regionCounters.Dubai.international, normalize(r.region), count);
    }
  }

  for (const r of region_sector_activity_demand || []) {
    const locationBase = normalize(r.location_base);
    const scope = normalize(r.scope);
    const count = safeNum(r.count);

    const rawActivityName = String(r.activity_name ?? "").trim();
    const rawActivityId = String(r.activity_id ?? "").trim();
    const looked = rawActivityId ? activityById.get(rawActivityId) : undefined;
    const sectorLabel = String(r.sector ?? "").trim() || looked?.sector || "Unknown";
    const activityLabel = rawActivityName || looked?.activity_name || rawActivityId || "Unknown";

    if (locationBase === "Dubai") {
      addScopedRanking(sectorCounters.Dubai, scope, sectorLabel, count);
      addScopedRanking(activityCounters.Dubai, scope, activityLabel, count);
    }

    if (locationBase === "UAE") {
      const emirate = normalizeEmirate(r.emirate);
      const bucketKey = emirate === "Unknown" ? "Unknown" : emirate;
      if (!sectorCounters.emirates[bucketKey]) sectorCounters.emirates[bucketKey] = createScopeCounters();
      if (!activityCounters.emirates[bucketKey]) activityCounters.emirates[bucketKey] = createScopeCounters();
      addScopedRanking(sectorCounters.emirates[bucketKey], scope, sectorLabel, count);
      addScopedRanking(activityCounters.emirates[bucketKey], scope, activityLabel, count);
      addScopedRanking(sectorCounters.OtherEmirates, scope, sectorLabel, count);
      addScopedRanking(activityCounters.OtherEmirates, scope, activityLabel, count);
    }

    if (locationBase === "International") {
      const country = normalize(r.country);
      const bucketKey = country === "Unknown" ? "Unknown" : country;
      if (!sectorCounters.countries[bucketKey]) sectorCounters.countries[bucketKey] = createScopeCounters();
      if (!activityCounters.countries[bucketKey]) activityCounters.countries[bucketKey] = createScopeCounters();
      addScopedRanking(sectorCounters.countries[bucketKey], scope, sectorLabel, count);
      addScopedRanking(activityCounters.countries[bucketKey], scope, activityLabel, count);
      addScopedRanking(sectorCounters.International, scope, sectorLabel, count);
      addScopedRanking(activityCounters.International, scope, activityLabel, count);
    }
  }

  const countryOptions = [...countrySet].sort((a, b) => a.localeCompare(b));

  const countryRankings: CountryRankings = {
    local: toTopRankings(
      Object.fromEntries(
        Object.entries(countryTotalsByScope)
          .filter(([k]) => k !== "All Countries" && k !== "Unknown")
          .map(([k, v]) => [k, v.local])
      )
    ),
    international: toTopRankings(
      Object.fromEntries(
        Object.entries(countryTotalsByScope)
          .filter(([k]) => k !== "All Countries" && k !== "Unknown")
          .map(([k, v]) => [k, v.international])
      )
    ),
  };

  const internationalTopRegionsAll = Object.entries(regionTotalsInternational)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mapScopeRankings = (scopeCounts?: ReturnType<typeof createScopeCounters>): ScopeBreakdown<RankingItem> => ({
    local: toTopRankings(scopeCounts?.local || {}),
    international: toTopRankings(scopeCounts?.international || {}),
  });

  const sectorRankings: GeographyRankings = {
    Dubai: mapScopeRankings(sectorCounters.Dubai),
    OtherEmirates: mapScopeRankings(sectorCounters.OtherEmirates),
    International: mapScopeRankings(sectorCounters.International),
    emirates: Object.fromEntries(
      Object.entries(sectorCounters.emirates).map(([key, counts]) => [key, mapScopeRankings(counts)])
    ),
    countries: Object.fromEntries(
      Object.entries(sectorCounters.countries).map(([key, counts]) => [key, mapScopeRankings(counts)])
    ),
  };

  const activityRankings: GeographyRankings = {
    Dubai: mapScopeRankings(activityCounters.Dubai),
    OtherEmirates: mapScopeRankings(activityCounters.OtherEmirates),
    International: mapScopeRankings(activityCounters.International),
    emirates: Object.fromEntries(
      Object.entries(activityCounters.emirates).map(([key, counts]) => [key, mapScopeRankings(counts)])
    ),
    countries: Object.fromEntries(
      Object.entries(activityCounters.countries).map(([key, counts]) => [key, mapScopeRankings(counts)])
    ),
  };

  const regionRankings: RegionRankings = {
    Dubai: toTopRankings(regionCounters.Dubai.international),
    OtherEmirates: toTopRankings(regionCounters.OtherEmirates.international),
    International: toTopRankings(regionCounters.International.international),
    countries: Object.fromEntries(
      Object.entries(regionCounters.countries).map(([key, counts]) => [key, toTopRankings(counts.international)])
    ),
  };

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
          sectorRankings={sectorRankings}
          activityRankings={activityRankings}
          regionRankings={regionRankings}
          countryRankings={countryRankings}
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
