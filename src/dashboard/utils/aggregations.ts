import { normalizeKey, safeNum } from "./formatters";

type DetailedLocation = {
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