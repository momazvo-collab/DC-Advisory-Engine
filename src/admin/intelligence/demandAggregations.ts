import { normalizeKey, safeNum } from "../../dashboard/utils/formatters";

export type TopService = { service_id: string; click_count: number };

export type DetailedLocation = {
  location_base: string | null;
  emirate: string | null;
  country: string | null;
  scope: string | null;
  region: string | null;
  count: number;
};

type BaseKey = "Dubai" | "UAE" | "International";

export function computeBaseScopeMatrix(detailed: DetailedLocation[]) {
  const base: Record<BaseKey, { Local: number; International: number; Total: number }> = {
    Dubai: { Local: 0, International: 0, Total: 0 },
    UAE: { Local: 0, International: 0, Total: 0 },
    International: { Local: 0, International: 0, Total: 0 }
  };

  for (const r of detailed || []) {
    const locationBase = normalizeKey(r.location_base) as BaseKey;
    const scope = normalizeKey(r.scope);
    const count = safeNum(r.count);

    if (!base[locationBase]) continue;

    if (scope === "Local") {
      base[locationBase].Local += count;
    }

    if (scope === "International") {
      base[locationBase].International += count;
    }

    base[locationBase].Total += count;
  }

  return base;
}

export type ActivityBreakdown = {
  activity_id: string;
  activity_name: string;
  sector: string;
  subsector: string;
  count: number;
};

export type RegionDemand = { region: string; count: number };
export type SectorDemand = { sector: string; count: number };
export type SectorScopeDemand = { scope: string; sector: string; count: number };
export type RegionSectorDemand = { region: string; sector: string; count: number };

export type Kpis = {
  results_viewed: number;
  email_submitted: number;
  email_link_clicked: number;
  email_submit_rate: number;
  email_click_rate_from_submitted: number;
  email_click_rate_from_viewed: number;
};

export type AnalyticsResponse = {
  kpis: Kpis;
  top_services: TopService[];
  detailed_location: DetailedLocation[];
  activity_breakdown: ActivityBreakdown[];
  region_demand: RegionDemand[];
  sector_demand: SectorDemand[];
  sector_scope_demand?: SectorScopeDemand[];
  region_sector_demand?: RegionSectorDemand[];
};

export function computeUaeEmiratesTable(detailed: DetailedLocation[]) {
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

export function computeInternationalCountriesTable(detailed: DetailedLocation[]) {
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

export function computeDubaiExpansionRegions(detailed: DetailedLocation[]) {
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

export function computeUaeExpansionRegions(detailed: DetailedLocation[]) {
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

export function buildRegionToSectorIndex(regionSector: RegionSectorDemand[]) {
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

export function buildSectorToActivitiesIndex(activityBreakdown: ActivityBreakdown[]) {
  const m = new Map<string, { activity_id: string; activity_name: string; count: number }[]>();

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

export function buildExecutiveSignals(data: AnalyticsResponse) {
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

  const emirateMap = new Map<string, number>();
  detailed_location.forEach((r) => {
    if (normalizeKey(r.location_base) !== "uae") return;

    const emirate = normalizeKey(r.emirate);
    emirateMap.set(emirate, (emirateMap.get(emirate) || 0) + safeNum(r.count));
  });

  const topEmirate =
    [...emirateMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

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
