import type { ActivityAttributes } from "../engine/serviceResolver";
import sectorDefaultsRaw from "./sectorDefaults.json";
import subsectorAttributesRaw from "./subsectorAttributes.json";
import activityOverridesRaw from "./activityOverrides.json";

type SubsectorKey = `${string}::${string}`;

type SubsectorAttributesRow = {
  sector: string;
  subsector: string;
  goods_type?: "none" | "physical";
  delivery_mode?: "physical" | "digital" | "hybrid";
  restricted_goods?: boolean;
  consumable_goods?: boolean;
  uses_transportable_equipment?: boolean;
  ata_facilitator?: boolean;
  coo_facilitator?: boolean;
  bid_whitelist?: boolean;
};

function key(sector: string, subsector: string): SubsectorKey {
  return `${sector}::${subsector}`;
}

function mapRowToActivityAttributes(row: SubsectorAttributesRow): ActivityAttributes {
  return {
    goods_type: row.goods_type,
    delivery_mode: row.delivery_mode === "hybrid" ? "hybrid" : row.delivery_mode,
    restricted_goods: row.restricted_goods,
    consumable_goods: row.consumable_goods,
    uses_transportable_equipment: row.uses_transportable_equipment,
    ata_facilitator: row.ata_facilitator,
    coo_facilitator: row.coo_facilitator,
    bid_whitelist: row.bid_whitelist
  };
}

const SUBSECTOR_ATTR_INDEX: Record<SubsectorKey, ActivityAttributes> = Object.fromEntries(
  (subsectorAttributesRaw as SubsectorAttributesRow[]).map((r) => [key(r.sector, r.subsector), mapRowToActivityAttributes(r)])
);

export function getActivityAttributesBySubsector(sector: string, subsector: string): ActivityAttributes {
  return SUBSECTOR_ATTR_INDEX[key(sector, subsector)] ?? {};
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

function mapOverrideFlagsToActivityAttributes(flags?: EligibilityOverrideFlags): ActivityAttributes {
  if (!flags) return {};
  return {
    coo_facilitator: flags.coo === true ? true : undefined,
    ata_facilitator: flags.ata === true ? true : undefined,
    business_in_dubai: typeof flags.business_in_dubai === "boolean" ? flags.business_in_dubai : undefined
  };
}

export function getEffectiveActivityAttributes(input: {
  activity_id: string;
  sector: string;
  subsector: string;
}): ActivityAttributes {
  const sectorDefaults = (sectorDefaultsRaw as Record<string, ActivityAttributes | undefined>)[input.sector] ?? {};
  const base = getActivityAttributesBySubsector(input.sector, input.subsector);

  const o = activityOverridesRaw as unknown as OverridesFile;
  const subsectorKey = `${input.sector}||${input.subsector}`;
  const subsectorOverride = mapOverrideFlagsToActivityAttributes(o.subsector_overrides?.[subsectorKey]);
  const activityOverride = mapOverrideFlagsToActivityAttributes(o.activity_overrides?.[input.activity_id]);

  return mergeActivityAttributes(sectorDefaults, base, subsectorOverride, activityOverride);
}
