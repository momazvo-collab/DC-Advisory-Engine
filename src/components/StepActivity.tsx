import React, { useMemo, useRef, useState } from "react";
import { Button } from "./ui";
import activities from "../data/activities.json";

export function StepActivity({ value, onChange, onNext, onBack }: any) {
  console.log("Total activities:", (activities as any).length);

  const [query, setQuery] = useState(value || "");
  const [debouncedQuery, setDebouncedQuery] = useState(value || "");
  const [selected, setSelected] = useState<any>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [glow, setGlow] = useState(false);
  const [activeSubsector, setActiveSubsector] = useState<string | null>(null);
  const [expandedSubsectors, setExpandedSubsectors] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const INTENT_CARDS = [
    { emoji: "🚚", label: "Logistics", value: "Logistics" },
    { emoji: "💻", label: "Tech", value: "Information Technology" },
    { emoji: "🛍️", label: "Trading", value: "Trading" },
    { emoji: "🏗️", label: "Construction", value: "Construction" },
    { emoji: "🏭", label: "Manufacturing", value: "Manufacturing" },
    { emoji: "🧾", label: "Professional Services", value: "Professional Services" },
    { emoji: "🏥", label: "Healthcare", value: "Healthcare" },
    { emoji: "🌴", label: "Tourism", value: "Hospitality" }
  ] as const;

  // Simplified smart search
  // - single selection only
  // - strong activity match: exact + token scoring
  // - small synonym normalization (common business terms)
  const SYNONYMS: Array<[RegExp, string]> = [
    [/\bcar\s+dealer(ship)?\b/gi, "car dealership"],
    [/\bauto\s+dealer(ship)?\b/gi, "car dealership"],
    [/\bimport\s*export\b/gi, "import/export"],
    [/\bfreight\b/gi, "freight forwarding"],
    [/\bit\s+consultant(s|cy)?\b/gi, "it consulting"],
    [/\bsoftware\s+dev(elopment)?\b/gi, "software development"],
  ];

  function applySynonyms(str: string) {
    let out = str || "";
    for (const [re, rep] of SYNONYMS) out = out.replace(re, rep);
    return out;
  }

  function normalizeSpaced(str: string) {
    return applySynonyms(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCompact(str: string) {
    return normalizeSpaced(str).replace(/\s+/g, "");
  }

  function tokens(str: string) {
    return normalizeSpaced(str).split(" ").filter(Boolean);
  }

  const sectorFilteredActivities = useMemo(() => {
    return (activities as any).filter((a: any) => {
      if (sectorFilter && a.sector !== sectorFilter) return false;
      return true;
    });
  }, [sectorFilter]);

  const subsectorGroups = useMemo(() => {
    if (!sectorFilter) return [] as Array<{ name: string; activities: any[] }>;

    const inSector = (activities as any).filter((a: any) => a.sector === sectorFilter);
    const groups = new Map<string, any[]>();
    for (const a of inSector) {
      const ss = String(a.subsector || "").trim() || "Other";
      const arr = groups.get(ss);
      if (arr) arr.push(a);
      else groups.set(ss, [a]);
    }

    return [...groups.entries()]
      .map(([name, acts]) => ({ name, activities: acts }))
      .sort((a, b) => {
        if (b.activities.length !== a.activities.length) return b.activities.length - a.activities.length;
        return a.name.localeCompare(b.name);
      });
  }, [sectorFilter]);

  const commonActivities = useMemo(() => {
    const q = String(debouncedQuery || "").trim();
    if (!sectorFilter) return [] as any[];
    if (q) return [] as any[];

    const counts = new Map<string, number>();
    for (const a of sectorFilteredActivities as any) {
      const ss = String(a.subsector || "");
      counts.set(ss, (counts.get(ss) || 0) + 1);
    }

    const sortedActs = [...(sectorFilteredActivities as any)].sort((a: any, b: any) => {
      const ca = counts.get(String(a.subsector || "")) || 0;
      const cb = counts.get(String(b.subsector || "")) || 0;
      if (cb !== ca) return cb - ca;
      return String(a.activity_name).localeCompare(String(b.activity_name));
    });

    return sortedActs.slice(0, 5);
  }, [debouncedQuery, sectorFilter, sectorFilteredActivities]);

  function score(queryStr: string, item: any) {
    const q = normalizeSpaced(queryStr);
    if (!q) return 0;

    const qCompact = q.replace(/\s+/g, "");
    const name = normalizeSpaced(item.activity_name);
    const sector = normalizeSpaced(item.sector);
    const subsector = normalizeSpaced(item.subsector);
    const nameCompact = name.replace(/\s+/g, "");
    const subsectorCompact = subsector.replace(/\s+/g, "");
    const sectorCompact = sector.replace(/\s+/g, "");

    if (nameCompact === qCompact) return 10000;

    let s = 0;
    if (nameCompact.startsWith(qCompact)) s += 2500;
    if (subsectorCompact.startsWith(qCompact)) s += 1200;
    if (sectorCompact.startsWith(qCompact)) s += 800;

    const qTokens = tokens(q);
    const nameTokens = new Set(tokens(name));
    const subsectorTokens = new Set(tokens(subsector));
    const sectorTokens = new Set(tokens(sector));

    for (const t of qTokens) {
      if (nameTokens.has(t)) s += 420;
      else if (name.includes(t)) s += 260;

      if (subsectorTokens.has(t)) s += 240;
      else if (subsector.includes(t)) s += 140;

      if (sectorTokens.has(t)) s += 160;
      else if (sector.includes(t)) s += 90;
    }

    return s;
  }

  const results = useMemo(() => {
    const q = String(debouncedQuery || "").trim();
    if (!q) return [] as any[];

    const sortedActs = [...(sectorFilteredActivities as any)]
      .map((x: any) => ({ x, s: score(q, x) }))
      .filter((r: any) => r.s > 0)
      .sort((a: any, b: any) => {
        if (b.s !== a.s) return b.s - a.s;
        return String(a.x.activity_name).localeCompare(String(b.x.activity_name));
      })
      .slice(0, 8)
      .map((r: any) => r.x);

    return sortedActs;
  }, [debouncedQuery, sectorFilteredActivities]);

  const canProceed = !!selected;

  const isEmptyQuery = !String(query || "").trim();
  const showPopular = !!sectorFilter && isEmptyQuery && activeSubsector === null && !expandedSubsectors;
  const showExpanded = !!sectorFilter && isEmptyQuery && activeSubsector === null && expandedSubsectors;

  function handleIntentClick(value: string) {
    setSelected(null);
    onChange(null);
    setActiveSubsector(null);
    setExpandedSubsectors(false);

    setSectorFilter((prev) => {
      const next = prev === value ? null : value;

      // Trigger glow ONLY when selecting a new sector
      if (prev !== value) {
        setGlow(true);
        setTimeout(() => setGlow(false), 1200);
      }

      return next;
    });

    setQuery("");
    setDebouncedQuery("");

    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <style>
        {`@keyframes stepActivityFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.step-activity-fade-in{animation:stepActivityFadeIn .24s ease-out both}`}
      </style>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 text-center">
          What does your business do?
        </h1>
        <p className="mt-3 text-gray-500 text-sm md:text-base text-center">
          Start typing your licensed activity or browse by sector below.
        </p>

        <div className="relative mt-8 max-w-2xl mx-auto">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              sectorFilter
                ? `Search within ${sectorFilter}...`
                : "e.g. Software development, Freight forwarding..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDebouncedQuery(e.target.value);
              setSelected(null);
            }}
            className={`w-full h-14 pl-12 pr-10 rounded-2xl border border-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-500 ease-out ${
              glow ? "ring-4 ring-blue-400 shadow-2xl" : ""
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                setSelected(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300 ease-out active:scale-[0.97]"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {!query && sectorFilter && (
            <button
              type="button"
              onClick={() => {
                setSectorFilter(null);
                setActiveSubsector(null);
                setExpandedSubsectors(false);
                setQuery("");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="text-sm text-slate-500 text-center mt-3">
          {sectorFilter
            ? `Showing results in ${sectorFilter}. Type to refine or click the sector again to clear.`
            : "Type your activity or choose a sector below"}
        </div>

        <div className="mt-10 max-w-5xl mx-auto step-activity-fade-in">
          <div className="text-base font-semibold text-slate-800 text-center mt-6 mb-4">Popular Sectors</div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {INTENT_CARDS.map((card) => (
              <button
                key={card.label}
                onClick={() => handleIntentClick(card.value)}
                className={`px-5 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-out hover:scale-105 active:scale-[0.97] ${
                  sectorFilter === card.value
                    ? "bg-blue-600 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <div className="text-3xl">{card.emoji}</div>
                  <div className="mt-1">{card.label}</div>
                </div>
              </button>
            ))}
          </div>

          {sectorFilter && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setSectorFilter(null);
                  setActiveSubsector(null);
                  setExpandedSubsectors(false);
                  setQuery("");
                }}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all duration-300 ease-out active:scale-[0.97]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {showPopular && (
          <div className="mt-8 max-w-5xl mx-auto">
            <div className="text-xs uppercase tracking-wide text-gray-400 text-center">Popular Categories</div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {subsectorGroups.slice(0, 6).map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setActiveSubsector(g.name)}
                  className="w-full text-left rounded-2xl border border-gray-200 bg-white px-5 py-4 hover:bg-blue-50 hover:border-blue-200 transition"
                >
                  <div className="text-sm font-semibold text-gray-800 leading-snug">{g.name}</div>
                  <div className="mt-2 text-sm text-gray-500">{g.activities.length} activities</div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setExpandedSubsectors(true)}
                className="px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Browse all categories ↓
              </button>
            </div>
          </div>
        )}

        {showExpanded && (
          <div className="mt-8 max-w-5xl mx-auto step-activity-fade-in">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setExpandedSubsectors(false)}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all duration-300 ease-out active:scale-[0.97]"
              >
                Collapse ↑
              </button>
            </div>

            <div className="mt-5 max-h-[65vh] md:max-h-[70vh] overflow-auto rounded-2xl border border-gray-200 bg-white">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {subsectorGroups.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => {
                      setActiveSubsector(g.name);
                    }}
                    className="w-full h-28 md:h-32 text-left rounded-2xl border border-gray-200 bg-white px-5 py-4 transition-all duration-300 ease-out hover:scale-[1.01] hover:border-blue-300 hover:bg-blue-50 active:scale-[0.97]"
                  >
                    <div className="text-sm md:text-base font-semibold text-gray-800 leading-snug">{g.name}</div>
                    <div className="text-sm md:text-base text-gray-500 mt-2">{g.activities.length} activities</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {sectorFilter && !String(query || "").trim() && activeSubsector !== null && (
          <div className="mt-8 max-w-3xl mx-auto step-activity-fade-in">
            <button
              type="button"
              onClick={() => {
                setActiveSubsector(null);
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to categories
            </button>

            <div className="mt-4 space-y-3">
              {(subsectorGroups.find((g) => g.name === activeSubsector)?.activities || []).map((r: any) => {
                const isSelected = selected?.activity_id === r.activity_id;
                return (
                  <button
                    key={r.activity_id}
                    type="button"
                    onClick={() => {
                      setSelected(r);
                      setQuery(r.activity_name);
                      setDebouncedQuery(r.activity_name);
                      onChange(r);
                    }}
                    className={`w-full text-sm md:text-base text-left rounded-2xl border px-5 py-4 md:px-6 md:py-5 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.97] ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="text-base md:text-lg font-semibold text-gray-800 leading-snug">{r.activity_name}</div>
                    <div className="text-sm text-gray-500 mt-2">{r.sector} • {r.subsector}</div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 text-center">
              <button
                onClick={() => setActiveSubsector(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Categories
              </button>
            </div>
          </div>
        )}

        {!!String(query || "").trim() && (
          <div className="mt-8 max-w-3xl mx-auto step-activity-fade-in">
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((r: any) => {
                  const isSelected = selected?.activity_id === r.activity_id;
                  return (
                    <button
                      key={r.activity_id}
                      type="button"
                      onClick={() => {
                        setSelected(r);
                        setQuery(r.activity_name);
                        onChange(r);
                      }}
                      className={`w-full text-sm md:text-base text-left rounded-2xl border px-5 py-4 md:px-6 md:py-5 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.97] ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="text-base md:text-lg font-semibold text-gray-800 leading-snug">{r.activity_name}</div>
                      <div className="text-sm text-gray-500 mt-2">{r.sector} • {r.subsector}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center">No results found.</div>
            )}
          </div>
        )}

        {selected && (
          <div className="mt-10 max-w-3xl mx-auto border border-blue-200 rounded-2xl p-6 bg-white shadow-md transition-all duration-200">
            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Selected Activity</div>
            <div className="text-xl md:text-2xl font-semibold text-gray-800 mt-2 leading-snug">{selected.activity_name}</div>
            <div className="text-sm md:text-base text-gray-500 mt-2">{selected.sector} • {selected.subsector}</div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            disabled={!canProceed}
            onClick={() => {
              if (selected) { onNext(); return; }
            }}
            className="mt-12 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 md:py-5 text-base md:text-lg rounded-xl shadow-md transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
