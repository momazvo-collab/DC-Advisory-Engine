import React from "react";

import ExecutiveSignals from "../../dashboard/sections/ExecutiveSignals";
import { Panel } from "../../dashboard/components/Panel";
import { KpiCard } from "../../dashboard/components/KpiCard";
import { SectionTitle } from "../../dashboard/components/SectionTitle";

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Results viewed" value={formatInt(kpis.results_viewed)} />
        <KpiCard label="Emails submitted" value={formatInt(kpis.email_submitted)} />
        <KpiCard label="Submit rate" value={formatPct(kpis.email_submit_rate)} />
        <KpiCard label="Click rate from viewed" value={formatPct(kpis.email_click_rate_from_viewed)} />
      </div>

      {/* Executive Signals */}
      <ExecutiveSignals signals={signals} />
    </>
  );
}
