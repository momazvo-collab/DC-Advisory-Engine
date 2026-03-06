import React from "react";
import { formatInt } from "../utils/formatters";

export function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
      <div className="min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate text-gray-700">{label}</span>
          <span className="ml-3 font-semibold text-gray-900">
            {formatInt(value)}
          </span>
        </div>

        <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#003B5C]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-400 w-10 text-right">
        {Math.round(pct)}%
      </div>
    </div>
  );
}