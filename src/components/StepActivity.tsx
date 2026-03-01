import React, { useMemo, useRef, useState } from "react";
import { Button } from "./ui";
import activities from "../data/activities.json";
import { sectorMeta } from "../data/sectorMeta";

export function StepActivity({ value, onChange, onNext, onBack }: any) {
  const [query, setQuery] = useState(value || "");
  const [debouncedQuery, setDebouncedQuery] = useState(value || "");
  const [selected, setSelected] = useState<any>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [glow, setGlow] = useState(false);
  const [activeSubsector, setActiveSubsector] = useState<string | null>(null);
  const [level, setLevel] = useState<"sector" | "subsector" | "activityList" | "focus">("sector");

  const sectorScrollRef = useRef<HTMLDivElement | null>(null);
  const subsectorScrollRef = useRef<HTMLDivElement | null>(null);
  const activityListScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollMemoryRef = useRef<{ sector: number; subsector: number; activityList: number }>({
    sector: 0,
    subsector: 0,
    activityList: 0
  });

  const [showAllSectors, setShowAllSectors] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const allSectors = useMemo<string[]>(() => {
    const raw = (activities as any[]).map((a: any) => String(a?.sector || "").trim());
    const filtered = raw.filter((s): s is string => Boolean(s));
    return [...new Set(filtered)].sort();
  }, []);

  const POPULAR_SECTOR_ORDER = useMemo<string[]>(
    () => [
      "Logistics",
      "Information Technology",
      "Trading",
      "Construction",
      "Manufacturing",
      "Professional Services",
      "Healthcare",
      "Hospitality"
    ],
    []
  );

  const popularSectors = useMemo<string[]>(() => {
    return POPULAR_SECTOR_ORDER.filter((s) => allSectors.includes(s));
  }, [POPULAR_SECTOR_ORDER, allSectors]);

  const remainingSectors = useMemo<string[]>(() => {
    const popularSet = new Set(popularSectors);
    return allSectors.filter((s) => !popularSet.has(s));
  }, [allSectors, popularSectors]);

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

  const subsectorActivities = useMemo(() => {
    if (!sectorFilter || !activeSubsector) return [] as any[];
    return (subsectorGroups.find((g) => g.name === activeSubsector)?.activities || []) as any[];
  }, [activeSubsector, sectorFilter, subsectorGroups]);

  const activityListItems = useMemo(() => {
    if (!activeSubsector) return [] as any[];
    const q = String(debouncedQuery || "").trim();
    if (!q) {
      return [...subsectorActivities].sort((a: any, b: any) =>
        String(a.activity_name).localeCompare(String(b.activity_name))
      );
    }

    return [...subsectorActivities]
      .map((x: any) => ({ x, s: score(q, x) }))
      .filter((r: any) => r.s > 0)
      .sort((a: any, b: any) => {
        if (b.s !== a.s) return b.s - a.s;
        return String(a.x.activity_name).localeCompare(String(b.x.activity_name));
      })
      .map((r: any) => r.x);
  }, [activeSubsector, debouncedQuery, subsectorActivities]);

  const canProceed = level === "focus" && !!selected;

  function handleIntentClick(value: string) {
    setSelected(null);
    onChange(null);
    setActiveSubsector(null);
    setSectorFilter((prev) => {
      if (prev !== value) {
        setGlow(true);
        setTimeout(() => setGlow(false), 1200);
      }
      return value;
    });

    setQuery("");
    setDebouncedQuery("");

    setLevel("subsector");

    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleClearAll() {
    setSelected(null);
    onChange(null);
    setSectorFilter(null);
    setActiveSubsector(null);
    setQuery("");
    setDebouncedQuery("");
    setShowAllSectors(false);
    scrollMemoryRef.current.sector = 0;
    scrollMemoryRef.current.subsector = 0;
    scrollMemoryRef.current.activityList = 0;
    if (sectorScrollRef.current) sectorScrollRef.current.scrollTop = 0;
    if (subsectorScrollRef.current) subsectorScrollRef.current.scrollTop = 0;
    if (activityListScrollRef.current) activityListScrollRef.current.scrollTop = 0;
    setLevel("sector");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function captureScrollForLevel(l: "sector" | "subsector" | "activityList") {
    if (l === "sector") scrollMemoryRef.current.sector = sectorScrollRef.current?.scrollTop || 0;
    if (l === "subsector") scrollMemoryRef.current.subsector = subsectorScrollRef.current?.scrollTop || 0;
    if (l === "activityList") scrollMemoryRef.current.activityList = activityListScrollRef.current?.scrollTop || 0;
  }

  function restoreScrollForLevel(l: "sector" | "subsector" | "activityList") {
    const top =
      l === "sector"
        ? scrollMemoryRef.current.sector
        : l === "subsector"
          ? scrollMemoryRef.current.subsector
          : scrollMemoryRef.current.activityList;

    requestAnimationFrame(() => {
      if (l === "sector" && sectorScrollRef.current) sectorScrollRef.current.scrollTop = top;
      if (l === "subsector" && subsectorScrollRef.current) subsectorScrollRef.current.scrollTop = top;
      if (l === "activityList" && activityListScrollRef.current) activityListScrollRef.current.scrollTop = top;
    });
  }

  function handleBackWithinStep() {
    if (level === "focus") {
      setLevel("activityList");
      restoreScrollForLevel("activityList");
      return;
    }
    if (level === "activityList") {
      captureScrollForLevel("activityList");
      setSelected(null);
      onChange(null);
      setLevel("subsector");
      restoreScrollForLevel("subsector");
      return;
    }
    if (level === "subsector") {
      captureScrollForLevel("subsector");
      setActiveSubsector(null);
      setSectorFilter(null);
      setSelected(null);
      onChange(null);
      setLevel("sector");
      restoreScrollForLevel("sector");
      return;
    }
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
              activeSubsector
                ? `Search within ${activeSubsector}...`
                : "e.g. Software development, Freight forwarding..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDebouncedQuery(e.target.value);
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

          {!query && (sectorFilter || activeSubsector || selected) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-sm text-slate-500 text-center mt-3">
          {sectorFilter
            ? `Showing results in ${sectorFilter}. Type to refine or click the sector again to clear.`
            : "Type your activity or choose a sector below"}
        </div>

        {level === "sector" && (
          <div className="mt-10 max-w-5xl mx-auto step-activity-fade-in">
            <div className="text-base font-semibold text-slate-800 text-center mt-6 mb-4">{showAllSectors ? "All Sectors" : "Popular Sectors"}</div>

            <div
              ref={sectorScrollRef}
              onScroll={() => captureScrollForLevel("sector")}
              className="mt-4 max-h-[65vh] md:max-h-[70vh] overflow-auto rounded-2xl"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(showAllSectors ? allSectors : popularSectors).map((sector) => {
                  const meta = sectorMeta[sector];
                  const label = meta?.displayLabel ?? sector;
                  const emoji = meta?.emoji ?? "📁";
                  const isSelected = sectorFilter === sector;
                  return (
                    <button
                      key={sector}
                      onClick={() => {
                        captureScrollForLevel("sector");
                        handleIntentClick(sector);
                        restoreScrollForLevel("subsector");
                      }}
                      className={`px-5 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-out hover:scale-105 active:scale-[0.97] ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <div className="text-3xl">{emoji}</div>
                        <div className="mt-1">{label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllSectors((v) => !v)}
                className="px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {showAllSectors ? "Show Less ▲" : "View All Sectors ▾"}
              </button>
            </div>
          </div>
        )}

        {level === "subsector" && sectorFilter && (
          <div className="mt-8 max-w-5xl mx-auto step-activity-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">{sectorFilter}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleBackWithinStep();
                  }}
                  className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              ref={subsectorScrollRef}
              onScroll={() => captureScrollForLevel("subsector")}
              className="mt-5 max-h-[65vh] md:max-h-[70vh] overflow-auto rounded-2xl border border-gray-200 bg-white"
            >
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subsectorGroups.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => {
                      captureScrollForLevel("subsector");
                      setActiveSubsector(g.name);
                      setSelected(null);
                      onChange(null);
                      setLevel("activityList");
                      restoreScrollForLevel("activityList");
                    }}
                    className="w-full h-24 md:h-28 text-left rounded-2xl border border-gray-200 bg-white px-5 py-4 transition-all duration-300 ease-out hover:scale-[1.01] hover:border-blue-300 hover:bg-blue-50 active:scale-[0.97]"
                  >
                    <div className="text-sm md:text-base font-semibold text-gray-800 leading-snug">{g.name}</div>
                    <div className="text-sm text-gray-500 mt-2">{g.activities.length} activities</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleBackWithinStep}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {level === "activityList" && sectorFilter && activeSubsector && (
          <div className="mt-8 max-w-3xl mx-auto step-activity-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">{activeSubsector}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackWithinStep}
                  className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              ref={activityListScrollRef}
              onScroll={() => captureScrollForLevel("activityList")}
              className="mt-4 max-h-[65vh] md:max-h-[70vh] overflow-auto rounded-2xl"
            >
              <div className="space-y-3">
                {activityListItems.length > 0 ? (
                  activityListItems.map((r: any) => {
                    return (
                      <button
                        key={r.activity_id}
                        type="button"
                        onClick={() => {
                          captureScrollForLevel("activityList");
                          setSelected(r);
                          onChange(r);
                          setLevel("focus");
                        }}
                        className="w-full text-sm md:text-base text-left rounded-2xl border px-5 py-4 md:px-6 md:py-5 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.97] border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="text-base md:text-lg font-semibold text-gray-800 leading-snug">{r.activity_name}</div>
                        <div className="text-sm text-gray-500 mt-2">{r.sector} • {r.subsector}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500 text-center">No results found.</div>
                )}
              </div>
            </div>

            <div className="pt-6 text-center flex justify-center gap-2">
              <button
                type="button"
                onClick={handleBackWithinStep}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {level === "focus" && selected && (
          <div className="mt-10 max-w-3xl mx-auto step-activity-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackWithinStep}
                className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 border border-blue-200 rounded-2xl p-6 bg-white shadow-md transition-all duration-200">
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Selected Activity</div>
              <div className="text-xl md:text-2xl font-semibold text-gray-800 mt-2 leading-snug">{selected.activity_name}</div>
              <div className="text-sm md:text-base text-gray-500 mt-2">{selected.sector} • {selected.subsector}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12">
          <Button
            variant="outline"
            onClick={() => {
              if (level === "sector") {
                onBack();
                return;
              }
              handleBackWithinStep();
            }}
          >
            Back
          </Button>
          <Button
            disabled={!canProceed}
            onClick={() => {
              if (level === "focus" && selected) {
                onNext();
                return;
              }
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
