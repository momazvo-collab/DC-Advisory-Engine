import type { Activity, Service } from "../types";

// UI SAFE MODE resolver (mock). Replace with real engine later.
export function resolveServicesMock(location: any, scope: any, activity: Activity): Service[] {
  const services: Service[] = [];
  if (!location || !scope || !activity) return [];

  const goodsSectors = ["Logistics","Manufacturing","Retail","Energy","Agriculture","Automotive","Aviation","Maritime","Healthcare"];
  const isGoodsBased = goodsSectors.includes(activity.sector);

  if (isGoodsBased) {
    services.push({ service_name: "Certificate of Origin (COO)" });
    services.push({ service_name: "ATA Carnet" });
  }

  services.push({ service_name: "Attestation" });
  services.push({ service_name: "Mediation" });

  if (scope === "Local") {
    services.push({ service_name: "Expand North Star" });
    services.push({ service_name: "Business Group & Council" });
    services.push({ service_name: "CSR" });

    const digitalEligibleSectors = ["Technology","E-Commerce"];
    const techKeywordMatch =
      activity.subsector?.toLowerCase().includes("software") ||
      activity.subsector?.toLowerCase().includes("it") ||
      activity.subsector?.toLowerCase().includes("marketplace") ||
      activity.subsector?.toLowerCase().includes("e-learning") ||
      activity.activity_name?.toLowerCase().includes("software") ||
      activity.activity_name?.toLowerCase().includes("online") ||
      activity.activity_name?.toLowerCase().includes("platform") ||
      activity.activity_name?.toLowerCase().includes("it");

    const isDigitalEligible = digitalEligibleSectors.includes(activity.sector) || techKeywordMatch;
    if (isDigitalEligible) services.push({ service_name: "Business in Dubai (Dubai Chambers Digital)" });
  }

  if (scope === "International") {
    services.push({ service_name: "Dubai Global" });
    services.push({ service_name: "New Horizons" });
  }

  return services;
}
