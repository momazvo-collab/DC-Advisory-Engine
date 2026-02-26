export const REGION_OFFICES = [
  { id: "north_america", name: "North America", countries: [{ code: "US", name: "United States" },{ code: "CA", name: "Canada" },{ code: "MX", name: "Mexico" }] },
  { id: "latin_america", name: "Latin America", countries: [{ code: "BR", name: "Brazil" },{ code: "AR", name: "Argentina" },{ code: "CO", name: "Colombia" }] },
  { id: "europe", name: "Europe", countries: [{ code: "UK", name: "United Kingdom" },{ code: "DE", name: "Germany" },{ code: "FR", name: "France" },{ code: "IT", name: "Italy" },{ code: "NL", name: "Netherlands" },{ code: "PL", name: "Poland" },{ code: "SE", name: "Sweden" }] },
  { id: "africa", name: "Africa", countries: [{ code: "EG", name: "Egypt" },{ code: "ET", name: "Ethiopia" },{ code: "GH", name: "Ghana" },{ code: "KE", name: "Kenya" },{ code: "MZ", name: "Mozambique" },{ code: "NG", name: "Nigeria" },{ code: "ZA", name: "South Africa" }] },
  { id: "asia", name: "Asia", countries: [{ code: "BD", name: "Bangladesh" },{ code: "CN", name: "China" },{ code: "IN", name: "India" },{ code: "ID", name: "Indonesia" },{ code: "JP", name: "Japan" },{ code: "SG", name: "Singapore" },{ code: "TH", name: "Thailand" },{ code: "VN", name: "Vietnam" }] },
  { id: "middle_east", name: "Middle East", countries: [{ code: "IL", name: "Israel" },{ code: "TR", name: "Turkey" }] },
  { id: "eurasia", name: "Eurasia", countries: [{ code: "AZ", name: "Azerbaijan" },{ code: "KZ", name: "Kazakhstan" },{ code: "RU", name: "Russia" }] },
  { id: "oceania", name: "Oceania", countries: [{ code: "AU", name: "Australia" }] }
] as const;
