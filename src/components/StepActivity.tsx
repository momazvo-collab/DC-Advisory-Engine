import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui";
import activities from "../data/activities.json";

export function StepActivity({ value, onChange, onNext, onBack }: any) {
  console.log("Total activities:", (activities as any).length);

  const [query, setQuery] = useState(value || "");
  const [debouncedQuery, setDebouncedQuery] = useState(value || "");
  const [selected, setSelected] = useState<any>(null);
  const [sectorFilter, setSectorFilter] = useState<any>(null);
  const POPULAR_SECTORS = [
    "Technology",
    "Logistics",
    "Healthcare",
    "Manufacturing",
    "Professional Services",
  ] as const;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

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

  const filteredActivities = useMemo(() => {
    return (activities as any).filter((a: any) => {
      if (sectorFilter) {
        const sf = String(sectorFilter).toLowerCase();
        const sector = String(a.sector || "").toLowerCase();
        const name = String(a.activity_name || "").toLowerCase();

        if (sf === "logistics") {
          const logisticsKeywords = ["transport", "freight", "truck", "cargo", "shipping", "road"];
          const sectorMatch = sector.includes("logistics");
          const nameMatch = logisticsKeywords.some((k) => name.includes(k));
          if (!sectorMatch && !nameMatch) return false;
        } else {
          if (!sector.includes(sf)) return false;
        }
      }
      return true;
    });
  }, [sectorFilter]);

  function relevanceScore(rawQuery: string, item: any) {
    const q = String(rawQuery || "").trim().toLowerCase();
    if (!q) return 0;

    const name = String(item.activity_name || "").trim().toLowerCase();
    const subsector = String(item.subsector || "").trim().toLowerCase();
    const sector = String(item.sector || "").trim().toLowerCase();

    if (name === q) return 100;
    if (name.startsWith(q)) return 90;
    if (name.includes(q)) return 75;
    if (subsector.includes(q)) return 50;
    if (sector.includes(q)) return 30;
    return 0;
  }

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
    if (q) {
      return filteredActivities
        .map((x: any) => ({ x, s: relevanceScore(q, x) }))
        .filter((r: any) => r.s > 0)
        .sort((a: any, b: any) => {
          if (b.s !== a.s) return b.s - a.s;
          return String(a.x.activity_name).localeCompare(String(b.x.activity_name));
        })
        .slice(0, 8)
        .map((r: any) => r.x);
    }

    if (sectorFilter) {
      return filteredActivities
        .slice()
        .sort((a: any, b: any) => String(a.activity_name).localeCompare(String(b.activity_name)))
        .slice(0, 8);
    }

    return [] as any[];
  }, [debouncedQuery, filteredActivities, sectorFilter]);

  const canProceed = !!selected;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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
            type="text"
            placeholder="e.g. Software development, Freight forwarding..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="w-full h-14 pl-12 pr-10 rounded-2xl border border-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelected(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
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
        </div>

        {!query && (
          <div className="mt-10 max-w-5xl mx-auto">
            <div className="text-xs uppercase tracking-wide text-gray-400 text-center">Popular sectors</div>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {POPULAR_SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSelected(null);
                    setSectorFilter((prev: any) => (prev === s ? null : s));
                  }}
                  className={`px-5 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-150 hover:scale-105 ${
                    sectorFilter === s
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {s}
                </button>
              ))}

              {sectorFilter && (
                <button
                  onClick={() => { setSectorFilter(null); }}
                  className="px-5 py-3 rounded-full bg-white text-gray-600 text-sm font-medium cursor-pointer border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all duration-150"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 max-w-3xl mx-auto">
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
                    className={`w-full text-left rounded-2xl border px-5 py-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
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
            <div className="text-sm text-gray-500 text-center">
              {query ? "No results found." : sectorFilter ? "Select an activity from this sector." : "Start typing to search activities."}
            </div>
          )}
        </div>

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
            className="mt-12 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-md transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
