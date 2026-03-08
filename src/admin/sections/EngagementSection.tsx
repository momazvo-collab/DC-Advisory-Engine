import React from "react";

import { Panel } from "../../dashboard/components/Panel";
import { SectionTitle } from "../../dashboard/components/SectionTitle";

import type { ActivityBreakdown, Kpis, TopService } from "../intelligence/demandAggregations";

export default function EngagementSection({
  kpis,
  topServicesSorted,
  activityBreakdown,
  formatInt,
  topN,
  safeNum,
}: {
  kpis?: Kpis;
  topServicesSorted: TopService[];
  activityBreakdown: ActivityBreakdown[];
  formatInt: (v: number) => string;
  topN: <T>(rows: T[], n: number, getCount: (t: T) => number) => T[];
  safeNum: (n: any) => number;
}) {
  return (
    <>
      {/* Engagement */}
      <SectionTitle title="Engagement signals" subtitle="What users actually click and ask for." />

      <Panel title="User Journey">
        {!kpis ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            <Row label="Results viewed" value={formatInt(kpis.results_viewed)} />
            <Row label="Email submitted" value={formatInt(kpis.email_submitted)} />
            <Row label="Email link clicked" value={formatInt(kpis.email_link_clicked)} />
          </div>
        )}
      </Panel>

      <Panel title="Conversion Insight">
        {!kpis ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            <Row label="Email submit rate" value={`${(safeNum(kpis.email_submit_rate) * 100).toFixed(1)}%`} />
            <Row
              label="Email click rate"
              value={`${(safeNum(kpis.email_click_rate_from_submitted) * 100).toFixed(1)}%`}
            />
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Service Interest">
          {topServicesSorted.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {topServicesSorted.map((s) => (
                <Row key={s.service_id} label={s.service_id} value={formatInt(s.click_count)} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Activity Interest">
          {activityBreakdown.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {topN(activityBreakdown, 10, (a) => safeNum(a.count)).map((a) => (
                <Row key={a.activity_id} label={a.activity_name} value={formatInt(a.count)} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Data note */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-[#003B5C]">Data note</div>
        <div className="mt-2 text-sm text-gray-600 leading-relaxed">
          Region → Sector is supported by <span className="font-semibold">region_sector_demand</span>.
          Activities are expandable per sector using <span className="font-semibold">activity_breakdown</span>, which is currently{" "}
          <span className="font-semibold">not keyed by region/emirate/country</span>. When you add an RPC that returns
          <span className="font-semibold"> region + sector + activity_id</span> (and optionally location_base), the activity drill-down
          will become region-accurate with no UI redesign.
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="pr-6 text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}
