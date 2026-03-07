import React from "react";

type EmirateRow = {
  emirate: string;
  Total: number;
};

type Props = {
  data: EmirateRow[];
};

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain"
];

export default function UAEEmiratesMap({ data }: Props) {

  const emirateCounts: Record<string, number> = {};

  data.forEach((d) => {
    emirateCounts[d.emirate] = d.Total;
  });

  const max = Math.max(...Object.values(emirateCounts), 1);

  function colorScale(value: number) {
    const intensity = value / max;
    const shade = Math.floor(255 - intensity * 150);
    return `rgb(0, ${shade}, ${shade})`;
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4">

      {EMIRATES.map((emirate) => {

        const value = emirateCounts[emirate] || 0;

        return (
          <div
            key={emirate}
            className="rounded-xl p-4 text-white text-sm font-semibold"
            style={{
              background: value
                ? colorScale(value)
                : "#E5E7EB"
            }}
          >
            <div>{emirate}</div>
            <div className="text-xs mt-1">
              {value} signals
            </div>
          </div>
        );
      })}

    </div>
  );
}