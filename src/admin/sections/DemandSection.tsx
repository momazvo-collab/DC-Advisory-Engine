import React from "react";

import { Row } from "../../dashboard/components/Row";

import { safeNum, topN } from "../../dashboard/utils/formatters";

import type { ActivityBreakdown, DetailedLocation, SectorDemand } from "../intelligence/demandAggregations";

export default function DemandSection({
  baseMatrix,
  detailedLocation: _detailedLocation,
  sectorDemand,
  activityBreakdown,
  uaeEmiratesRows,
  uaeEmirates,
  showAllUaeEmirates,
  setShowAllUaeEmirates,
  uaeHeatmapData,
  countriesRows,
  countries,
  showAllCountries,
  setShowAllCountries,
  heatmapData: _heatmapData,
  formatInt,
}: {
  baseMatrix: Record<string, { Local: number; International: number; Total: number }>;
  detailedLocation: DetailedLocation[];
  sectorDemand: SectorDemand[];
  activityBreakdown: ActivityBreakdown[];
  uaeEmiratesRows: { emirate: string; Local: number; International: number; Total: number }[];
  uaeEmirates: { emirate: string; Local: number; International: number; Total: number }[];
  showAllUaeEmirates: boolean;
  setShowAllUaeEmirates: React.Dispatch<React.SetStateAction<boolean>>;
  uaeHeatmapData: { emirate: string; Total: number }[];
  countriesRows: { country: string; Local: number; International: number; Total: number }[];
  countries: { country: string; Local: number; International: number; Total: number }[];
  showAllCountries: boolean;
  setShowAllCountries: React.Dispatch<React.SetStateAction<boolean>>;
  heatmapData: { region: string; sector: string; count: number }[];
  formatInt: (v: number) => string;
}) {
  const topSectorRows = topN(sectorDemand || [], 10, (s) => safeNum(s.count));
  const sectorMax = safeNum(topSectorRows[0]?.count) || 1;

  const topActivityRows = topN(activityBreakdown || [], 10, (a) => safeNum(a.count));

  return (
    <>
      <SectionHeader>DEMAND INTELLIGENCE</SectionHeader>

      <SectionHeader>JURISDICTION OVERVIEW</SectionHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Dubai">
          <div className="space-y-2">
            <Row label="Local" value={formatInt(baseMatrix.Dubai?.Local || 0)} />
            <Row label="International" value={formatInt(baseMatrix.Dubai?.International || 0)} />
            <Row label="Total" value={formatInt(baseMatrix.Dubai?.Total || 0)} />
          </div>
        </Card>

        <Card title="Other Emirates">
          <div className="space-y-2">
            <Row label="Local" value={formatInt(baseMatrix.UAE?.Local || 0)} />
            <Row label="International" value={formatInt(baseMatrix.UAE?.International || 0)} />
            <Row label="Total" value={formatInt(baseMatrix.UAE?.Total || 0)} />
          </div>
        </Card>

        <Card title="International">
          <div className="space-y-2">
            <Row label="Local" value={formatInt(baseMatrix.International?.Local || 0)} />
            <Row label="International" value={formatInt(baseMatrix.International?.International || 0)} />
            <Row label="Total" value={formatInt(baseMatrix.International?.Total || 0)} />
          </div>
        </Card>
      </div>

      <SectionHeader>GEOGRAPHIC DEMAND</SectionHeader>

      <Card title="UAE emirates">
        {uaeEmiratesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="divide-y divide-gray-100">
            {uaeEmiratesRows.map((r) => (
              <TableRow4
                key={r.emirate}
                a={r.emirate}
                b={formatInt(r.Local)}
                c={formatInt(r.International)}
                d={formatInt(r.Total)}
              />
            ))}
            {uaeEmirates.length > 6 ? (
              <Toggle expanded={showAllUaeEmirates} onClick={() => setShowAllUaeEmirates((v) => !v)} />
            ) : null}
          </div>
        )}
      </Card>

      <Card title="UAE emirate demand intensity">
        <EmiratesHeatmap data={uaeHeatmapData} formatInt={formatInt} />
      </Card>

      <Card title="International countries">
        {countriesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="divide-y divide-gray-100">
            {countriesRows.map((r) => (
              <TableRow4
                key={r.country}
                a={r.country}
                b={formatInt(r.Local)}
                c={formatInt(r.International)}
                d={formatInt(r.Total)}
              />
            ))}
            {countries.length > 6 ? (
              <Toggle expanded={showAllCountries} onClick={() => setShowAllCountries((v) => !v)} />
            ) : null}
          </div>
        )}
      </Card>

      <SectionHeader>SECTOR DEMAND</SectionHeader>

      <Card title="Top sectors">
        {topSectorRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            {topSectorRows.map((s, i) => (
              <SectorBarRow
                key={`${s.sector}-${i}`}
                label={s.sector}
                value={safeNum(s.count)}
                max={sectorMax}
                colorClass={sectorBarColor(i)}
                formatInt={formatInt}
              />
            ))}
          </div>
        )}
      </Card>

      <SectionHeader>ACTIVITY DEMAND</SectionHeader>

      <Card title="Top activities">
        {topActivityRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {topActivityRows.map((a) => (
              <Row key={a.activity_id} label={a.activity_name} value={formatInt(a.count)} />
            ))}
          </div>
        )}
      </Card>
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

function sectorBarColor(index: number) {
  if (index === 0) return "bg-[#003B5C]";
  if (index === 1) return "bg-[#5A8CA8]";
  if (index === 2) return "bg-[#7CA8C0]";
  return "bg-[#9CC2D6]";
}

function SectorBarRow({
  label,
  value,
  max,
  colorClass,
  formatInt,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
  formatInt: (v: number) => string;
}) {
  const pct = Math.max(0, Math.min(1, value / (max || 1)));
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="min-w-0 truncate text-gray-700">{label}</div>
        <div className="text-right font-semibold text-gray-900 tabular-nums">{formatInt(value)}</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function EmiratesHeatmap({
  data,
  formatInt,
}: {
  data: { emirate: string; Total: number }[];
  formatInt: (v: number) => string;
}) {
  const valueByEmirate: Record<string, number> = {};
  data.forEach((d) => {
    valueByEmirate[d.emirate] = safeNum(d.Total);
  });

  const emirates = [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Ras Al Khaimah",
    "Fujairah",
    "Umm Al Quwain",
  ];

  function bucketClass(v: number) {
    if (!v) return "bg-gray-100 text-gray-700";
    if (v === 1) return "bg-[#DCEAF3] text-gray-900";
    if (v === 2) return "bg-[#7CA8C0] text-white";
    return "bg-[#003B5C] text-white";
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {emirates.map((emirate) => {
        const v = valueByEmirate[emirate] || 0;
        return (
          <div key={emirate} className={`rounded-xl p-4 ${bucketClass(v)}`}>
            <div className="text-sm font-semibold">{emirate}</div>
            <div className="mt-1 text-xs opacity-90">{formatInt(v)} signals</div>
          </div>
        );
      })}
    </div>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}

function TableRow4({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-2 text-sm hover:bg-gray-50">
      <div className="min-w-0 truncate text-gray-700">{a}</div>
      <div className="text-right font-semibold text-gray-900 w-16 tabular-nums">{b}</div>
      <div className="text-right font-semibold text-gray-900 w-16 tabular-nums">{c}</div>
      <div className="text-right font-semibold text-gray-900 w-16 tabular-nums">{d}</div>
    </div>
  );
}

function Toggle({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pt-2 text-sm font-semibold text-[#003B5C] hover:underline"
    >
      {expanded ? "Show less" : "View all"}
    </button>
  );
}
