// src/engine/serviceResolver.ts
// v1.8.1 Hybrid Resolver (C):
// 1) sectorDefaults (broad intent defaults)
// 2) subsectorAttributes (authoritative attribute flags)
// 3) activity/subsector overrides (edge cases & corrections)
//
// UI must NEVER implement eligibility rules. UI only renders output of this resolver.

import sectorDefaults from "../data/sectorDefaults.json";
import subsectorAttributes from "../data/subsectorAttributes.json";
import overrides from "../data/activityOverrides.json";

export type LocationInput = {
  base: "Dubai" | "UAE" | "International" | null;
  emirate?: string;
  country?: string;
};

export type ScopeInput = "Local" | "International" | null;

export type Activity = {
  activity_id: string;
  activity_name: string;
  sector: string;
  subsector: string;
};

type SubsectorAttributesRow = {
  sector: string;
  subsector: string;
  goods_type: "none" | "physical";
  service_type: "none" | "professional" | "operational";
  delivery_mode: "physical" | "digital" | "hybrid";
  asset_intensity?: "low" | "medium" | "high";
  restricted_goods?: boolean;
  ata_facilitator?: boolean;
  coo_facilitator?: boolean;
  uses_transportable_equipment?: boolean;
  consumable_goods?: boolean;
  bid_whitelist?: boolean;
};

type EligibilityFlags = {
  coo?: boolean;
  ata?: boolean;
  business_in_dubai?: boolean;
};

type OverridesFile = {
  subsector_overrides?: Record<string, Partial<EligibilityFlags>>;
  activity_overrides?: Record<string, Partial<EligibilityFlags>>;
};

const SUBSECTOR_ATTR_INDEX: Record<string, SubsectorAttributesRow> = Object.fromEntries(
  (subsectorAttributes as SubsectorAttributesRow[]).map((r) => [
    `${r.sector}||${r.subsector}`,
    r,
  ])
);

function mergeFlags(...parts: Array<Partial<EligibilityFlags> | undefined>): EligibilityFlags {
  const out: EligibilityFlags = {};
  for (const p of parts) {
    if (!p) continue;
    for (const k of Object.keys(p) as Array<keyof EligibilityFlags>) {
      const v = p[k];
      if (typeof v === "boolean") out[k] = v;
    }
  }
  return out;
}

function deriveFlagsFromSubsector(attrs?: SubsectorAttributesRow): EligibilityFlags {
  if (!attrs) return {};

  const coo = !!attrs.coo_facilitator;

  const ata = !!attrs.ata_facilitator || !!attrs.uses_transportable_equipment;

  // Digital visibility:
  // - delivery_mode: digital/hybrid => eligible by default
  // - sectorDefaults can also force eligibility
  const business_in_dubai = attrs.delivery_mode === "digital" || attrs.delivery_mode === "hybrid";

  return { coo, ata, business_in_dubai };
}

function getSectorDefaults(sector: string): Partial<EligibilityFlags> {
  // sectorDefaults.json is a simple mapping (string -> flags)
  // Keep permissive typing for JSON import
  const d: any = sectorDefaults as any;
  return d?.[sector] || {};
}

function getOverrides(activity: Activity): Partial<EligibilityFlags> {
  const o = overrides as unknown as OverridesFile;
  const key = `${activity.sector}||${activity.subsector}`;

  return mergeFlags(
    o?.subsector_overrides?.[key],
    o?.activity_overrides?.[activity.activity_id]
  );
}

export function resolveServices(
  location: LocationInput,
  scope: ScopeInput,
  activity: Activity | null
): Array<{ service_name: string }> {
  if (!location?.base || !scope || !activity) return [];

  const subsectorKey = `${activity.sector}||${activity.subsector}`;
  const attrs = SUBSECTOR_ATTR_INDEX[subsectorKey];

  const derived = deriveFlagsFromSubsector(attrs);
  const baseDefaults = getSectorDefaults(activity.sector);
  const ov = getOverrides(activity);

  // Hybrid final flags
  const flags = mergeFlags(derived, baseDefaults, ov);

  const services: Array<{ service_name: string }> = [];

  // Trade services (attribute driven)
  if (flags.coo) services.push({ service_name: "Certificate of Origin (COO)" });
  if (flags.ata) services.push({ service_name: "ATA Carnet" });

  // Core services (always)
  services.push({ service_name: "Attestation" });
  services.push({ service_name: "Mediation" });

  // Local services
  if (scope === "Local") {
    services.push({ service_name: "Expand North Star" });
    services.push({ service_name: "Business Group & Council" });
    services.push({ service_name: "CSR" });

    if (flags.business_in_dubai) {
      services.push({ service_name: "Business in Dubai (Dubai Chambers Digital)" });
    }
  }

  // International services
  if (scope === "International") {
    services.push({ service_name: "Dubai Global" });
    services.push({ service_name: "New Horizons" });
  }

  return services;
}
