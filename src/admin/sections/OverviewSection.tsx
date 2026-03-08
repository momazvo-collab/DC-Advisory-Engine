import React from "react";

import ExecutiveSignals from "../../dashboard/sections/ExecutiveSignals";
import { Panel } from "../../dashboard/components/Panel";
import { KpiCard } from "../../dashboard/components/KpiCard";
import { SectionTitle } from "../../dashboard/components/SectionTitle";

import type { Kpis } from "../intelligence/demandAggregations";

export default function OverviewSection({
  kpis,
  baseMatrix,
  signals,
  totalSubmissions,
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

      <Panel title="Total demand signals">
        <div className="text-4xl font-semibold text-[#003B5C]">{formatInt(totalSubmissions)}</div>
        <div className="text-sm text-gray-500 mt-2">Total advisory submissions across all jurisdictions</div>
      </Panel>

      {/* Jurisdiction Snapshot */}
      <SectionTitle
        title="Jurisdiction snapshot"
        subtitle="Always separated: Dubai (core), UAE other emirates (conversion), International (inbound)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Dubai">
          <MiniStat label="Local" value={formatInt(baseMatrix.Dubai?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.Dubai?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.Dubai?.Total || 0)} />
        </Panel>

        <Panel title="UAE (Other Emirates)">
          <MiniStat label="Local" value={formatInt(baseMatrix.UAE?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.UAE?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.UAE?.Total || 0)} />
        </Panel>

        <Panel title="International (Inbound)">
          <MiniStat label="Local" value={formatInt(baseMatrix.International?.Local || 0)} />
          <MiniStat label="International" value={formatInt(baseMatrix.International?.International || 0)} />
          <Divider />
          <MiniStat label="Total" value={formatInt(baseMatrix.International?.Total || 0)} />
        </Panel>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-[#003B5C]">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-gray-100" />;
}
