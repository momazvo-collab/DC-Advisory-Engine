// ============================================================================
// Dubai Chambers Advisory Engine
// serviceResolver.ts
// Single Source of Truth for Service Eligibility (v1.8.1 Stable)
// ============================================================================

export type BaseLocation = "Dubai" | "UAE" | "International";
export type SupportScope = "Local" | "International";

export interface UserLocationState {
  base: BaseLocation;
  emirate?: string;
  country?: string;
}

export interface ActivityAttributes {
  goods_type?: "physical" | "none";
  involves_goods?: boolean;
  delivery_mode?: "digital" | "service" | "hybrid" | "physical";
  restricted_goods?: boolean;
  consumable_goods?: boolean;
  uses_transportable_equipment?: boolean;
  ata_facilitator?: boolean;
  coo_facilitator?: boolean;
  bid_whitelist?: boolean;
  business_in_dubai?: boolean;
}

type EligibilityOverrideFlags = {
  coo?: boolean;
  ata?: boolean;
  business_in_dubai?: boolean;
};

type OverridesFile = {
  subsector_overrides?: Record<string, EligibilityOverrideFlags | undefined>;
  activity_overrides?: Record<string, EligibilityOverrideFlags | undefined>;
};

function mapOverrideFlagsToActivityAttributes(flags?: EligibilityOverrideFlags): ActivityAttributes {
  if (!flags) return {};
  return {
    coo_facilitator: flags.coo === true ? true : undefined,
    ata_facilitator: flags.ata === true ? true : undefined,
    business_in_dubai: typeof flags.business_in_dubai === "boolean" ? flags.business_in_dubai : undefined
  };
}

function mergeActivityAttributes(...parts: Array<ActivityAttributes | undefined>): ActivityAttributes {
  const out: ActivityAttributes = {};
  for (const p of parts) {
    if (!p) continue;
    for (const k of Object.keys(p) as Array<keyof ActivityAttributes>) {
      const v = p[k];
      if (v !== undefined) (out as any)[k] = v;
    }
  }
  return out;
}

function normalizeKeyPart(str: string) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSubsector(sector: string, subsector: string) {
  const s = normalizeKeyPart(subsector);

  if (normalizeKeyPart(sector) === "manufacturing") {
    if (s === "plastics" || s === "plastic" || s === "plastic products" || s === "plastics products") return "Plastic Products";
  }

  return subsector;
}

export interface ServiceCard {
  id: string;
  title: string;
  category: "commerce" | "local" | "international" | "membership";
}

// ============================================================================
// Service Registry (Metadata Only – No Eligibility Logic Here)
// ============================================================================

const SERVICE_REGISTRY: Record<string, ServiceCard> = {
  coo: {
    id: "coo",
    title: "Certificate of Origin",
    category: "commerce"
  },
  ata: {
    id: "ata",
    title: "ATA Carnet",
    category: "commerce"
  },
  csr: {
    id: "csr",
    title: "CSR",
    category: "commerce"
  },
  business_group_and_council: {
    id: "business_group_and_council",
    title: "Business Group and Council",
    category: "commerce"
  },
  attestation: {
    id: "attestation",
    title: "Document Attestation",
    category: "commerce"
  },
  mediation: {
    id: "mediation",
    title: "Commercial Mediation",
    category: "commerce"
  },
  business_in_dubai: {
    id: "business_in_dubai",
    title: "Business in Dubai",
    category: "local"
  },
  expand_north_star: {
    id: "expand_north_star",
    title: "Expand North Star",
    category: "local"
  },
  dubai_global: {
    id: "dubai_global",
    title: "Dubai Global",
    category: "international"
  },
  new_horizons: {
    id: "new_horizons",
    title: "New Horizons",
    category: "international"
  },
  become_member: {
    id: "become_member",
    title: "Become a Member",
    category: "membership"
  }
};

type SubsectorAttributesRow = {
  sector: string;
  subsector: string;
  goods_type?: "none" | "physical";
  involves_goods?: boolean;
  delivery_mode?: "physical" | "digital" | "hybrid";
  restricted_goods?: boolean;
  consumable_goods?: boolean;
  uses_transportable_equipment?: boolean;
  ata_facilitator?: boolean;
  coo_facilitator?: boolean;
  bid_whitelist?: boolean;
};

type SubsectorKey = `${string}::${string}`;

function subsectorKey(sector: string, subsector: string): SubsectorKey {
  return `${normalizeKeyPart(sector)}::${normalizeKeyPart(subsector)}`;
}

function mapRowToActivityAttributes(row: SubsectorAttributesRow): ActivityAttributes {
  return {
    goods_type: row.goods_type,
    involves_goods: row.involves_goods,
    delivery_mode: row.delivery_mode === "hybrid" ? "hybrid" : row.delivery_mode,
    restricted_goods: row.restricted_goods,
    consumable_goods: row.consumable_goods,
    uses_transportable_equipment: row.uses_transportable_equipment,
    ata_facilitator: row.ata_facilitator,
    coo_facilitator: row.coo_facilitator,
    bid_whitelist: row.bid_whitelist
  };
}

function buildSubsectorIndex(rows: SubsectorAttributesRow[]): Record<SubsectorKey, ActivityAttributes> {
  return Object.fromEntries(rows.map((r) => [subsectorKey(r.sector, r.subsector), mapRowToActivityAttributes(r)]));
}

export function resolveServicesHybrid(
  activity: { activity_id: string; sector: string; subsector: string },
  location: UserLocationState,
  scope: SupportScope,
  sources: {
    sectorDefaults: Record<string, ActivityAttributes | undefined>;
    subsectorAttributes: SubsectorAttributesRow[];
    overrides: OverridesFile;
  }
): ServiceCard[] {
  const sectorDefault = sources.sectorDefaults[activity.sector] ?? {};

  const normalizedSubsector = normalizeSubsector(activity.sector, activity.subsector);
  const subsectorIndex = buildSubsectorIndex(sources.subsectorAttributes);
  const subsectorAttr = subsectorIndex[subsectorKey(activity.sector, normalizedSubsector)] ?? {};

  const subsectorOverrideKey = `${activity.sector}||${activity.subsector}`;
  const subsectorOverride = mapOverrideFlagsToActivityAttributes(sources.overrides.subsector_overrides?.[subsectorOverrideKey]);
  const activityOverride = mapOverrideFlagsToActivityAttributes(sources.overrides.activity_overrides?.[activity.activity_id]);

  const finalAttributes = mergeActivityAttributes(sectorDefault, subsectorAttr, subsectorOverride, activityOverride);

  const involvesGoods = finalAttributes.goods_type === "physical" || finalAttributes.involves_goods === true;
  const derived = {
    involves_goods: involvesGoods,
    ata_facilitator: finalAttributes.ata_facilitator === true,
    restricted_goods: finalAttributes.restricted_goods === true,
    consumable_goods: finalAttributes.consumable_goods === true
  };

  // temporary debugging
  if (import.meta.env.DEV) {
    console.log("[resolver-debug] activity", activity.activity_id, activity.sector, activity.subsector);
    console.log("[resolver-debug] sectorDefault", sectorDefault);
    console.log("[resolver-debug] subsectorAttr", subsectorAttr);
    console.log("[resolver-debug] override", { subsectorOverride, activityOverride });
    console.log("[resolver-debug] finalAttributes", finalAttributes);
    console.log("[resolver-debug] derived", derived);
  }

  return resolveServices(finalAttributes, location, scope);
}

// ============================================================================
// Centralized Eligibility Resolver
// ============================================================================

export function resolveServices(
  activity: ActivityAttributes,
  location: UserLocationState,
  scope: SupportScope
): ServiceCard[] {
  const results: string[] = [];

  // temporary debugging
  if (import.meta.env.DEV) {
    console.log("[resolver-debug] scope", scope);
  }

  const isPhysical = activity.goods_type === "physical" || activity.involves_goods === true;
  const isRestricted = activity.restricted_goods === true;
  const isConsumable = activity.consumable_goods === true;
  const usesEquipment = activity.uses_transportable_equipment === true;
  const ataFacilitator = activity.ata_facilitator === true;
  const cooFacilitator = activity.coo_facilitator === true;
  const isDigitalService =
    activity.delivery_mode === "digital" ||
    activity.delivery_mode === "service" ||
    activity.delivery_mode === "hybrid";
  const isWhitelisted = activity.bid_whitelist === true;
  const businessInDubai = activity.business_in_dubai === true;

  // --------------------------------------------------------------------------
  // Always Available (Regardless of Scope)
  // --------------------------------------------------------------------------
  results.push("attestation");
  results.push("mediation");

  // --------------------------------------------------------------------------
  // Local Scope Services
  // --------------------------------------------------------------------------
  if (scope === "Local") {
    if (isPhysical || cooFacilitator) {
      results.push("coo");
    }

    if (
      ataFacilitator ||
      (isPhysical && !isConsumable && !isRestricted) ||
      (usesEquipment && !isRestricted)
    ) {
      results.push("ata");
    }

    results.push("csr");
    results.push("business_group_and_council");

    if (isDigitalService || isWhitelisted || businessInDubai) {
      results.push("business_in_dubai");
    }

    results.push("expand_north_star");

    if (location.base !== "Dubai") {
      results.push("become_member");
    }
  }

  // --------------------------------------------------------------------------
  // International Scope Services
  // --------------------------------------------------------------------------
  if (scope === "International") {
    if (isPhysical || cooFacilitator) {
      results.push("coo");
    }

    if (
      ataFacilitator ||
      (isPhysical && !isConsumable && !isRestricted) ||
      (usesEquipment && !isRestricted)
    ) {
      results.push("ata");
    }

    results.push("dubai_global");
    results.push("new_horizons");

    if (location.base !== "Dubai") {
      results.push("become_member");
    }
  }

  // --------------------------------------------------------------------------
  // Return Structured Service Cards
  // --------------------------------------------------------------------------
  const seen = new Set<string>();
  const uniqueIds: string[] = [];
  for (const id of results) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
  }

  return uniqueIds.map((id) => SERVICE_REGISTRY[id]);
}
