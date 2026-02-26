import sectorDefaults from "../data/sectorDefaults.json";
import subsectorAttributesRaw from "../data/subsectorAttributes.json";
import activityOverrides from "../data/activityOverrides.json";

/**
 * Dubai Chambers Advisory Engine
 * Enterprise Hybrid Resolver v2.3 (Array-safe subsector attributes)
 */

export type ResolveInput = {
  location_base: "Dubai" | "UAE" | "International";
  scope: "Local" | "International";
  activity: {
    activity_id: string;
    activity_name: string;
    sector: string;
    subsector: string;
    [k: string]: any;
  } | null;
};

export type ResolveOutput = {
  services: string[];
  requires_membership: boolean;
};

type AnyObj = Record<string, any>;

const subsectorRows: any[] = Array.isArray(subsectorAttributesRaw)
  ? (subsectorAttributesRaw as any[])
  : [];

const subsectorMap = new Map<string, AnyObj>();

if (subsectorRows.length > 0) {
  for (const row of subsectorRows) {
    const key = `${row.sector}||${row.subsector}`;
    subsectorMap.set(key, row);
  }
}

function getSubsectorAttributes(activity: any): AnyObj {
  if (!activity) return {};

  if (!Array.isArray(subsectorAttributesRaw)) {
    return (subsectorAttributesRaw as AnyObj)[activity.subsector] || {};
  }

  return (
    subsectorMap.get(`${activity.sector}||${activity.subsector}`) || {}
  );
}

function normalize(str: any) {
  return String(str ?? "").toLowerCase();
}

function inferDigital(activity: any) {
  const combined = normalize(
    `${activity.activity_name} ${activity.subsector} ${activity.sector}`
  );

  const digitalHit =
    /software|platform|online|marketplace|e-?commerce|saas|app|cloud|digital|ai|tech|systems?|automation|data|cyber|fintech|e-?learning/i.test(
      combined
    );

  const legalHit = /legal|law|attorney|litigation/i.test(combined);

  if (legalHit) return false;
  return digitalHit;
}

function inferGoods(activity: any) {
  const combined = normalize(
    `${activity.activity_name} ${activity.subsector} ${activity.sector}`
  );

  return /trading|manufactur|logistics|freight|shipping|import|export|distribution|warehouse|equipment|machin|agricult|pharma|oil|gas|commodit/i.test(
    combined
  );
}

export function resolveServices(input: ResolveInput): ResolveOutput {
  const { location_base, scope, activity } = input;

  if (!activity) {
    return { services: [], requires_membership: false };
  }

  const services = new Set<string>();

  const sectorDefault: AnyObj = (sectorDefaults as AnyObj)[activity.sector] || {};
  const subsectorAttr: AnyObj = getSubsectorAttributes(activity);
  const override: AnyObj =
    (activityOverrides as AnyObj)[activity.activity_id] || {};

  const finalAttributes = {
    ...sectorDefault,
    ...subsectorAttr,
    ...override,
  };

  const isGoods =
    finalAttributes.involves_goods === true ||
    finalAttributes.goods_based === true ||
    finalAttributes.coo_facilitator === true ||
    inferGoods(activity);

  const ataEligible =
    (finalAttributes.ata_facilitator === true ||
      finalAttributes.uses_transportable_equipment === true) &&
    finalAttributes.consumable_goods !== true &&
    finalAttributes.restricted_goods !== true;

  if (isGoods) {
    services.add("Certificate of Origin (COO)");
  }

  if (ataEligible) {
    services.add("ATA Carnet");
  }

  services.add("Attestation");
  services.add("Mediation");

  if (scope === "Local") {
    services.add("Expand North Star");
    services.add("Business Group & Council");
    services.add("CSR");

    const isDigital =
      finalAttributes.digital_visible === true ||
      finalAttributes.business_in_dubai === true ||
      finalAttributes.software_based === true ||
      inferDigital(activity);

    if (isDigital) {
      services.add("Business in Dubai (Dubai Chambers Digital)");
    }
  }

  if (scope === "International") {
    services.add("Dubai Global");
    services.add("New Horizons");
  }

  return {
    services: Array.from(services),
    requires_membership: location_base !== "Dubai",
  };
}
