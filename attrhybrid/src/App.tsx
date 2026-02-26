import React, { useReducer, useState, useMemo } from "react";
import ACTIVITIES from "./data/activities.json";
import { resolveServices } from "./engine/serviceResolver";

function Card({ children, className = "" }: any) { return <div className={className}>{children}</div>; }
function CardContent({ children, className = "" }: any) { return <div className={className}>{children}</div>; }
function Button({ children, variant, className = "", disabled, ...props }: any) {
  const base = "px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === "outline"
    ? "border border-[#E2E8F0] bg-white hover:border-[#0077B6]"
    : "bg-[#0077B6] text-white hover:bg-[#005F8A]";
  return <button className={`${base} ${styles} ${className}`} disabled={disabled} {...props}>{children}</button>;
}

const UAE_EMIRATES = ["Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah"];

const REGION_OFFICES = [
  { id: "north_america", name: "North America", countries: [{ code: "US", name: "United States" },{ code: "CA", name: "Canada" },{ code: "MX", name: "Mexico" }] },
  { id: "latin_america", name: "Latin America", countries: [{ code: "BR", name: "Brazil" },{ code: "AR", name: "Argentina" },{ code: "CO", name: "Colombia" }] },
  { id: "europe", name: "Europe", countries: [{ code: "UK", name: "United Kingdom" },{ code: "DE", name: "Germany" },{ code: "FR", name: "France" },{ code: "IT", name: "Italy" },{ code: "NL", name: "Netherlands" },{ code: "PL", name: "Poland" },{ code: "SE", name: "Sweden" }] },
  { id: "africa", name: "Africa", countries: [{ code: "EG", name: "Egypt" },{ code: "ET", name: "Ethiopia" },{ code: "GH", name: "Ghana" },{ code: "KE", name: "Kenya" },{ code: "MZ", name: "Mozambique" },{ code: "NG", name: "Nigeria" },{ code: "ZA", name: "South Africa" }] },
  { id: "asia", name: "Asia", countries: [{ code: "BD", name: "Bangladesh" },{ code: "CN", name: "China" },{ code: "IN", name: "India" },{ code: "ID", name: "Indonesia" },{ code: "JP", name: "Japan" },{ code: "SG", name: "Singapore" },{ code: "TH", name: "Thailand" },{ code: "VN", name: "Vietnam" }] },
  { id: "middle_east", name: "Middle East", countries: [{ code: "IL", name: "Israel" },{ code: "TR", name: "Turkey" }] },
  { id: "eurasia", name: "Eurasia", countries: [{ code: "AZ", name: "Azerbaijan" },{ code: "KZ", name: "Kazakhstan" },{ code: "RU", name: "Russia" }] },
  { id: "oceania", name: "Oceania", countries: [{ code: "AU", name: "Australia" }] }
] as const;

const initialState: any = { location: { base: null, emirate: "", country: "" }, scope: null, region: null, activity: null };

function reducer(state: any, action: any) {
  switch (action.type) {
    case "SET_LOCATION_BASE": {
      const base = action.payload;
      return { location: { base, emirate: "", country: "" }, scope: null, region: null, activity: null };
    }
    case "SET_LOCATION_EMIRATE":
      return { ...state, location: { ...state.location, emirate: action.payload } };
    case "SET_LOCATION_COUNTRY":
      return { ...state, location: { ...state.location, country: action.payload } };
    case "SET_SCOPE":
      return { ...state, scope: action.payload, region: null, activity: null };
    case "SET_REGION":
      return { ...state, region: action.payload };
    case "SET_ACTIVITY":
      return { ...state, activity: action.payload };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

export default function App() {
  const [step, setStep] = useState(1);
  const [formState, dispatch] = useReducer(reducer, initialState);
  const totalSteps = formState.scope === "International" ? 5 : 4;

  const resolvedServices = useMemo(() => {
    if (step !== totalSteps) return [];
    const { location, scope, activity } = formState;
    if (!location?.base || !scope || !activity) return [];
    return resolveServices(location, scope, activity);
  }, [step, formState, totalSteps]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans">
      <div className="bg-[#003B5C] text-white px-6 sm:px-10 lg:px-12 py-8 shadow-md sticky top-0 z-50">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide">Dubai Chambers Advisory Engine</h1>
        <p className="text-sm opacity-80 mt-2">Identify the right services based on your business profile</p>
      </div>

      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12">
        <Card className="rounded-2xl shadow-lg border border-[#E2E8F0] bg-white">
          <CardContent className="p-6 sm:p-8 lg:p-12">
            <StepIndicator step={step} totalSteps={totalSteps} />

            {step === 1 && (
              <StepLocation
                value={formState.location}
                onSetBase={(val: any) => dispatch({ type: "SET_LOCATION_BASE", payload: val })}
                onSetEmirate={(val: any) => dispatch({ type: "SET_LOCATION_EMIRATE", payload: val })}
                onSetCountry={(val: any) => dispatch({ type: "SET_LOCATION_COUNTRY", payload: val })}
                onNext={() => setStep((p) => p + 1)}
              />
            )}

            {step === 2 && (
              <StepScope
                value={formState.scope}
                onSelect={(val: any) => dispatch({ type: "SET_SCOPE", payload: val })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {step === 3 && formState.scope === "International" && (
              <StepRegion
                value={formState.region}
                onSelect={(val: any) => dispatch({ type: "SET_REGION", payload: val })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {((step === 3 && formState.scope !== "International") || (step === 4 && formState.scope === "International")) && (
              <StepActivity
                value={formState.activity?.activity_name || ""}
                onChange={(activityObj: any) => dispatch({ type: "SET_ACTIVITY", payload: activityObj })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {step === totalSteps && (
              <StepServices
                services={resolvedServices}
                location={formState.location}
                scope={formState.scope}
                region={formState.region}
                activity={formState.activity}
                onBack={() => setStep((p) => p - 1)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepIndicator({ step, totalSteps }: any) {
  const labels = ["Location", "Scope", "Region", "Activity", "Services"];
  return (
    <div className="mb-12">
      <div className="hidden md:flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex-1 text-center">
            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s ? "bg-[#0077B6] text-white" : "bg-gray-200 text-gray-600"}`}>{s}</div>
            <div className="text-xs mt-2 text-gray-600 font-medium">{labels[s - 1]}</div>
          </div>
        ))}
      </div>
      <div className="md:hidden text-center text-sm font-medium text-gray-600">Step {step} of {totalSteps}</div>
    </div>
  );
}

function StepLocation({ value, onSetBase, onSetEmirate, onSetCountry, onNext }: any) {
  const base = value?.base;
  const emirate = value?.emirate;
  const country = value?.country;

  const needsEmirate = base === "UAE";
  const needsCountry = base === "International";

  const canProceed = base === "Dubai" || (needsEmirate && !!emirate) || (needsCountry && !!country);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#003B5C]">1. Select Business Location</h2>
          <p className="text-sm text-gray-600 mt-1">Choose where the business is registered or based.</p>
        </div>
        <Button variant="outline" onClick={() => onSetBase(null)} className="hidden sm:inline-flex">Clear</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{ label: "Dubai", value: "Dubai" },{ label: "UAE (Other Emirate)", value: "UAE" },{ label: "International", value: "International" }].map((item) => (
          <div key={item.value} onClick={() => onSetBase(item.value)} className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${base === item.value ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}>
            <div className="font-medium text-[#003B5C]">{item.label}</div>
          </div>
        ))}
      </div>

      {needsEmirate && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-[#003B5C]">Select Emirate</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {UAE_EMIRATES.filter((e) => e !== "Dubai").map((e) => (
              <div key={e} onClick={() => onSetEmirate(e)} className={`rounded-xl p-4 text-center cursor-pointer border transition-all text-sm font-medium ${emirate === e ? "border-[#0077B6] bg-blue-50 text-[#003B5C]" : "border-[#E2E8F0] hover:border-[#0077B6] text-gray-700"}`}>{e}</div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Dubai-based businesses should select “Dubai” above.</p>
        </div>
      )}

      {needsCountry && <CountryAutocomplete value={country} onSelect={(val: any) => onSetCountry(val)} />}

      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={() => onSetBase(null)} className="sm:hidden">Clear</Button>
        <Button disabled={!canProceed} onClick={onNext} className="sm:ml-auto">Continue</Button>
      </div>
    </div>
  );
}

function CountryAutocomplete({ value, onSelect }: any) {
  const [query, setQuery] = useState(value || "");
  const [show, setShow] = useState(false);
  const allCountries = (REGION_OFFICES as any).flatMap((r: any) => r.countries);

  function normalize(str: string) { return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim(); }
  function levenshtein(a: string, b: string) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  }

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return allCountries
      .map((c: any) => {
        const name = normalize(c.name);
        const distance = levenshtein(q, name);
        const starts = name.startsWith(q);
        const contains = name.includes(q);
        return { ...c, starts, contains, distance };
      })
      .filter((c: any) => (c.starts) || (c.contains && q.length >= 3) || (c.distance <= 2 && q.length >= 4))
      .sort((a: any, b: any) => {
        if (a.starts && !b.starts) return -1;
        if (!a.starts && b.starts) return 1;
        if (a.contains && !b.contains) return -1;
        if (!a.contains && b.contains) return 1;
        return a.distance - b.distance;
      })
      .slice(0, 5);
  }, [query]);

  return (
    <div className="space-y-3 relative">
      <div className="text-sm font-semibold text-[#003B5C]">Type Country Name</div>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShow(true); onSelect(""); }}
        onFocus={() => setShow(true)}
        className="w-full border border-[#E2E8F0] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
        placeholder="Start typing country name..."
      />
      {show && query && (
        <div className="absolute z-10 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-md mt-2 max-h-64 overflow-y-auto">
          {suggestions.map((c: any) => (
            <div key={c.code} onClick={() => { setQuery(c.name); onSelect(c.name); setShow(false); }} className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm">{c.name}</div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">Smart suggestions with typo tolerance.</p>
    </div>
  );
}

function StepRegion({ value, onSelect, onNext, onBack }: any) {
  const regions = (REGION_OFFICES as any).map((r: any) => r.name);
  const canProceed = !!value;
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-[#003B5C]">2.5 Select Target Region</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((r: string) => (
          <div key={r} onClick={() => onSelect(r)} className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${value === r ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}>
            <div className="font-medium text-[#003B5C]">{r}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button disabled={!canProceed} onClick={onNext} className="sm:ml-auto">Continue</Button>
      </div>
    </div>
  );
}

function StepScope({ value, onSelect, onNext, onBack }: any) {
  const canProceed = value !== null;
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-[#003B5C]">2. Select Support Scope</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["Local","International"].map((item) => (
          <div key={item} onClick={() => onSelect(item)} className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${value === item ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}>
            <div className="font-medium text-[#003B5C]">{item} Support</div>
            <div className="text-xs text-gray-600 mt-1">{item === "Local" ? "Services and support within Dubai / UAE context" : "International expansion and market support"}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button disabled={!canProceed} onClick={onNext} className="sm:ml-auto">Continue</Button>
      </div>
    </div>
  );
}

function StepActivity({ value, onChange, onNext, onBack }: any) {
  const [query, setQuery] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [sectorFilter, setSectorFilter] = useState<any>(null);
  const [subsectorFilter, setSubsectorFilter] = useState<any>(null);

  function normalize(str: string) { return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim(); }
  function tokens(str: string) { return normalize(str).split(/[ ]+/).filter(Boolean); }

  const sectors = [...new Set((ACTIVITIES as any).map((a: any) => a.sector))];
  const subsectors = sectorFilter ? [...new Set((ACTIVITIES as any).filter((a: any) => a.sector === sectorFilter).map((a: any) => a.subsector))] : [];
  const filteredActivities = (ACTIVITIES as any).filter((a: any) => {
    if (sectorFilter && a.sector !== sectorFilter) return false;
    if (subsectorFilter && a.subsector !== subsectorFilter) return false;
    return true;
  });

  function score(queryStr: string, item: any) {
    const q = normalize(queryStr);
    if (!q) return 0;
    const name = normalize(item.activity_name);
    const sector = normalize(item.sector);
    const subsector = normalize(item.subsector);
    const combined = `${name} ${subsector} ${sector}`;
    const qTokens = tokens(q);
    let s = 0;
    if (name === q) return 3000;
    if (name.startsWith(q)) s += 2000;
    if (subsector.startsWith(q)) s += 1200;
    if (sector.startsWith(q)) s += 900;
    qTokens.forEach((t) => {
      if (name.includes(t)) s += 400;
      if (subsector.includes(t)) s += 250;
      if (sector.includes(t)) s += 180;
    });
    if (combined.includes(q)) s += 200;
    return s;
  }

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return filteredActivities
      .map((x: any) => ({ x, s: score(q, x) }))
      .filter((r: any) => r.s > 0)
      .sort((a: any, b: any) => b.s - a.s)
      .slice(0, 6)
      .map((r: any) => r.x);
  }, [query, sectorFilter, subsectorFilter]);

  const canProceed = !!selected || (sectorFilter && subsectorFilter);

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-[#003B5C]">What does your business do?</h2>
        <p className="text-sm text-gray-600 mt-3">Start typing your licensed activity or browse by sector below.</p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <input
          type="text"
          placeholder="e.g. Software development, Freight forwarding..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full border border-[#E2E8F0] rounded-2xl p-5 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
        />
        {showSuggestions && query && (
          <div className="absolute z-20 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-lg mt-3 max-h-80 overflow-y-auto">
            {suggestions.length > 0 ? suggestions.map((s: any) => (
              <div key={s.activity_id} onClick={() => { setSelected(s); setQuery(s.activity_name); onChange(s); setShowSuggestions(false); }} className="px-5 py-4 cursor-pointer hover:bg-blue-50 transition-all">
                <div className="text-base font-semibold text-[#003B5C]">{s.activity_name}</div>
                <div className="text-xs text-gray-600 mt-1">{s.sector} • {s.subsector}</div>
              </div>
            )) : <div className="px-5 py-4 text-sm text-gray-500">No close matches found</div>}
          </div>
        )}
      </div>

      <div className="text-center text-xs uppercase tracking-wide text-gray-400">Or browse by sector</div>

      <div className="flex flex-wrap justify-center gap-3">
        {sectors.map((s: any) => (
          <button key={s} onClick={() => { setSectorFilter(s); setSubsectorFilter(null); }}
            className={`px-4 py-2 rounded-full text-sm border transition-all ${sectorFilter === s ? "bg-[#0077B6] text-white border-[#0077B6] shadow-sm" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}>
            {s}
          </button>
        ))}
        {sectorFilter && (
          <button onClick={() => { setSectorFilter(null); setSubsectorFilter(null); }} className="px-4 py-2 rounded-full text-sm border border-gray-300 text-gray-600">Clear</button>
        )}
      </div>

      {subsectors.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {subsectors.map((ss: any) => (
            <button key={ss} onClick={() => setSubsectorFilter(ss)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${subsectorFilter === ss ? "bg-blue-100 border-[#0077B6] text-[#003B5C]" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}>
              {ss}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="max-w-2xl mx-auto border border-[#0077B6] rounded-2xl p-6 bg-[#E6F4FA] shadow-sm transition-all">
          <div className="text-xs text-[#0077B6] font-medium uppercase tracking-wide">Selected Activity</div>
          <div className="text-lg font-semibold text-[#003B5C] mt-2">{selected.activity_name}</div>
          <div className="text-sm text-gray-600 mt-1">{selected.sector} • {selected.subsector}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button
          disabled={!canProceed}
          onClick={() => {
            if (selected) { onNext(); return; }
            if (sectorFilter && subsectorFilter) {
              const fallback = (ACTIVITIES as any).find((a: any) => a.sector === sectorFilter && a.subsector === subsectorFilter);
              if (fallback) { setSelected(fallback); setQuery(fallback.activity_name); onChange(fallback); onNext(); }
            }
          }}
          className="sm:ml-auto"
        >Continue</Button>
      </div>
    </div>
  );
}

function StepServices({ services, location, scope, region, activity, onBack }: any) {
  const commerceServices = services.filter((s: any) =>
    ["Certificate of Origin (COO)","ATA Carnet","Attestation","Mediation","Business Group & Council","CSR"].includes(s.service_name)
  );
  const digitalServices = services.filter((s: any) =>
    ["Business in Dubai (Dubai Chambers Digital)","Expand North Star"].includes(s.service_name)
  );
  const internationalServices = services.filter((s: any) => ["Dubai Global","New Horizons"].includes(s.service_name));
  const showBecomeMember = location?.base && location.base !== "Dubai";
  const regionCountries = region ? (REGION_OFFICES as any).find((r: any) => r.name === region)?.countries || [] : [];

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold text-[#003B5C]">Eligible Services</h2>

      <div className="flex flex-wrap gap-3">
        {location?.base && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{location.base}</div>}
        {scope && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{scope}</div>}
        {activity && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{activity.activity_name}</div>}
      </div>

      {activity && (
        <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-blue-50">
          <div className="text-xs text-gray-600">Selected Activity</div>
          <div className="text-lg font-semibold text-[#003B5C] mt-1">{activity.activity_name}</div>
          <div className="text-sm text-gray-600 mt-1">{activity.sector} • {activity.subsector}</div>
        </div>
      )}

      {showBecomeMember && (
        <div className="border border-[#0077B6] rounded-2xl p-6 bg-white shadow-sm">
          <div className="text-lg font-semibold text-[#003B5C]">Become a Member of Dubai Chambers</div>
          <p className="text-sm text-gray-600 mt-2">Businesses not registered in Dubai must obtain Dubai Chambers membership to access certain services.</p>
          <Button className="mt-4 bg-[#0077B6] hover:bg-[#005F8A]">Become a Member</Button>
        </div>
      )}

      {commerceServices.length > 0 && (
        <div className="rounded-2xl border border-[#800020] bg-[#FAF2F4] p-6">
          <h3 className="text-xl font-semibold text-[#800020] mb-4">Dubai Chambers – Commerce</h3>
          <ServiceGrid services={commerceServices} />
        </div>
      )}

      {scope === "Local" && digitalServices.length > 0 && (
        <div className="rounded-2xl border border-[#0077B6] bg-[#E6F4FA] p-6">
          <h3 className="text-xl font-semibold text-[#0077B6] mb-4">Dubai Chambers – Digital</h3>
          <ServiceGrid services={digitalServices} />
        </div>
      )}

      {scope === "International" && internationalServices.length > 0 && (
        <div className="rounded-2xl border border-[#2E8B57] bg-[#EAF7EF] p-6">
          <h3 className="text-xl font-semibold text-[#2E8B57] mb-2">Dubai Chambers – International</h3>
          {region && (
            <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full bg-white border border-[#2E8B57] text-sm font-medium text-[#2E8B57]">
              Target Region: {region}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {internationalServices.map((service: any) => (
              <Card key={service.service_name} className="rounded-2xl border border-[#E2E8F0] hover:shadow-md transition-all bg-white">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-[#003B5C] mb-2">{service.service_name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Service eligibility based on selected business profile.</p>

                  {service.service_name === "Dubai Global" && region && regionCountries.length > 0 && (
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-[#2E8B57] mb-3">Supported Countries in {region}</div>
                      <div className="flex flex-wrap gap-2">
                        {regionCountries.map((country: any) => (
                          <div key={country.code} className="px-3 py-1 rounded-full bg-[#EAF7EF] text-sm text-[#2E8B57] border border-[#CDEBD8]">{country.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
}

function ServiceGrid({ services }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {services.map((service: any) => (
        <Card key={service.service_name} className="rounded-2xl shadow-sm border border-[#E2E8F0] bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#003B5C] mb-1">{service.service_name}</h3>
            <p className="text-sm text-gray-600">Service eligibility preview.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
