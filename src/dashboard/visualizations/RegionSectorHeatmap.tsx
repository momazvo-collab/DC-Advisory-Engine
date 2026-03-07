import React from "react";

type RegionSector = {
  region: string;
  sector: string;
  count: number;
};

type Props = {
  data: RegionSector[];
};

/* =============================
HELPERS
============================= */

function normalize(value: number, max: number) {
  if (max === 0) return 0;
  return value / max;
}

function colorScale(intensity: number) {
  // Light → Dark blue scale
  const c = Math.floor(255 - intensity * 160);
  return `rgb(${c}, ${c}, 255)`;
}

/* =============================
COMPONENT
============================= */

export default function RegionSectorHeatmap({ data }: Props) {
  // Safety guard
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4">
        No heatmap data available.
      </div>
    );
  }

  /* -----------------------------
  Extract unique regions & sectors
  ----------------------------- */

  const regions = [...new Set(data.map((d) => d.region))].sort();
  const sectors = [...new Set(data.map((d) => d.sector))].sort();

  /* -----------------------------
  Max value (for color scaling)
  ----------------------------- */

  const max = Math.max(...data.map((d) => d.count), 1);

  /* -----------------------------
  Build fast lookup table
  O(1) access instead of find()
  ----------------------------- */

  const lookup = new Map<string, number>();

  data.forEach((d) => {
    lookup.set(`${d.region}|${d.sector}`, d.count);
  });

  /* -----------------------------
  Build matrix
  ----------------------------- */

  const matrix = regions.map((region) =>
    sectors.map((sector) => {
      return lookup.get(`${region}|${sector}`) || 0;
    })
  );

  /* =============================
  RENDER
  ============================= */

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm min-w-full">
        {/* Header */}
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold text-gray-600">
              Region
            </th>

            {sectors.map((sector) => (
              <th
                key={sector}
                className="p-2 text-left font-semibold text-gray-600"
              >
                {sector}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={regions[rowIndex]}>
              <td className="p-2 font-semibold text-gray-700">
                {regions[rowIndex]}
              </td>

              {row.map((value, colIndex) => {
                const intensity = normalize(value, max);
                const background = colorScale(intensity);

                return (
                  <td
                    key={colIndex}
                    className="p-3 text-center font-semibold"
                    style={{ backgroundColor: background }}
                  >
                    {value > 0 ? value : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}