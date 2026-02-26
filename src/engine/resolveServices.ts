import type { Activity, LocationState, Scope } from "../types";
import sectorDefaultsRaw from "../data/sectorDefaults.json";
import subsectorAttributesRaw from "../data/subsectorAttributes.json";
import activityOverridesRaw from "../data/activityOverrides.json";
import { resolveServicesHybrid, type SupportScope, type UserLocationState, type ServiceCard } from "./serviceResolver";

function mapScope(scope: Scope): SupportScope {
  if (scope === "Local") return "Local";
  return "International";
}

export function resolveServicesForUI(input: {
  activity: Activity;
  location: LocationState;
  scope: Exclude<Scope, null>;
}): ServiceCard[] {
  const { activity, location, scope } = input;

  // temporary debugging
  if (import.meta.env.DEV) {
    console.log("[resolver-debug] uiScope", scope);
  }

  const resolverLocation: UserLocationState = {
    base: location.base as UserLocationState["base"],
    emirate: location.emirate || undefined,
    country: location.country || undefined
  };

  return resolveServicesHybrid(
    { activity_id: activity.activity_id, sector: activity.sector, subsector: activity.subsector },
    resolverLocation,
    mapScope(scope),
    {
      sectorDefaults: sectorDefaultsRaw as any,
      subsectorAttributes: subsectorAttributesRaw as any,
      overrides: activityOverridesRaw as any
    }
  );
}
