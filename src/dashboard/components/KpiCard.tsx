import React from "react";

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}