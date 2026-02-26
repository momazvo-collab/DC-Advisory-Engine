import React, { useMemo, useState } from "react";
import { REGION_OFFICES } from "../data/regionOffices";

export function CountryAutocomplete({ value, onSelect }: any) {
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
            <div
              key={c.code}
              onClick={() => { setQuery(c.name); onSelect(c.name); setShow(false); }}
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm"
            >
              {c.name}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">Smart suggestions with typo tolerance.</p>
    </div>
  );
}
