import React from "react";

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
      <SectionHeader>USER JOURNEY</SectionHeader>

      <Card title="Funnel">
        {!kpis ? (
          <Empty />
        ) : (
          <div className="divide-y divide-gray-100">
            <FunnelRow label="Results viewed" value={formatInt(kpis.results_viewed)} />
            <FunnelRow label="Email submitted" value={formatInt(kpis.email_submitted)} />
            <FunnelRow label="Email link clicked" value={formatInt(kpis.email_link_clicked)} />
          </div>
        )}
      </Card>

      <Card title="Conversion">
        {!kpis ? (
          <Empty />
        ) : (
          <div className="divide-y divide-gray-100">
            <FunnelRow label="Email submit rate" value={`${(safeNum(kpis.email_submit_rate) * 100).toFixed(1)}%`} />
            <FunnelRow
              label="Email click rate"
              value={`${(safeNum(kpis.email_click_rate_from_submitted) * 100).toFixed(1)}%`}
            />
          </div>
        )}
      </Card>

      <SectionHeader>SERVICE INTEREST</SectionHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top clicked services">
          {topServicesSorted.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-gray-100">
              {topServicesSorted.map((s) => (
                <FunnelRow key={s.service_id} label={s.service_id} value={formatInt(s.click_count)} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Top requested activities">
          {activityBreakdown.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-gray-100">
              {topN(activityBreakdown, 10, (a) => safeNum(a.count)).map((a) => (
                <FunnelRow key={a.activity_id} label={a.activity_name} value={formatInt(a.count)} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-gray-500 mb-4">{children}</div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white shadow-sm p-6">
      <div className="text-sm font-semibold text-[#003B5C] mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-2 text-sm hover:bg-gray-50">
      <div className="min-w-0 truncate text-gray-700">{label}</div>
      <div className="text-right font-semibold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}
