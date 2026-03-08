import React from "react";

import ExecutiveSignals from "../../dashboard/sections/ExecutiveSignals";

import type { Kpis } from "../intelligence/demandAggregations";

export default function OverviewSection({
  kpis,
  baseMatrix: _baseMatrix,
  signals,
  totalSubmissions: _totalSubmissions,
  formatInt,
  formatPct,
}: {
  kpis: Kpis;
  baseMatrix: Record<string, { Local: number; International: number; Total: number }>;
  signals: { label: string; value: string }[];
  totalSubmissions: number;
  formatInt: (v: number) => string;
  formatPct: (v: number) => string;
}) {
  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiTile label="Results viewed" value={formatInt(kpis.results_viewed)} />
        <KpiTile label="Emails submitted" value={formatInt(kpis.email_submitted)} />
        <KpiTile label="Submit rate" value={formatPct(kpis.email_submit_rate)} />
        <KpiTile label="Click rate from viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
      </div>

      {/* Executive Signals */}
      <ExecutiveSignals signals={signals} />
    </>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white shadow-sm p-6">
      <div className="text-4xl font-semibold text-[#003B5C]">{value}</div>
      <div className="mt-2 text-xs uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}
