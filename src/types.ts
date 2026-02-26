export type LocationBase = "Dubai" | "UAE" | "International" | null;
export type Scope = "Local" | "International" | null;

export type LocationState = { base: LocationBase; emirate: string; country: string; };

export type Activity = { activity_id: string; activity_name: string; sector: string; subsector: string; };

export type RegionCountry = { code: string; name: string };
export type RegionOffice = { id: string; name: string; countries: RegionCountry[] };

export type FormState = { location: LocationState; scope: Scope; region: string | null; activity: Activity | null; };

export type Service = { id: string; title: string; category: "commerce" | "local" | "international" | "membership" };
