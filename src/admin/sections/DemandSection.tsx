import React from "react";

import { Panel } from "../../dashboard/components/Panel";
import { BarRow } from "../../dashboard/components/BarRow";
import { Row } from "../../dashboard/components/Row";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import UAEEmiratesMap from "../../dashboard/visualizations/UAEEmiratesMap";

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
      <SectionTitle title="Demand Intelligence" />

      <SectionTitle title="Jurisdiction Overview" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Dubai">
          <Row label="Local" value={formatInt(baseMatrix.Dubai?.Local || 0)} />
          <Row label="International" value={formatInt(baseMatrix.Dubai?.International || 0)} />
          <Row label="Total" value={formatInt(baseMatrix.Dubai?.Total || 0)} />
        </Panel>

        <Panel title="Other Emirates">
          <Row label="Local" value={formatInt(baseMatrix.UAE?.Local || 0)} />
          <Row label="International" value={formatInt(baseMatrix.UAE?.International || 0)} />
          <Row label="Total" value={formatInt(baseMatrix.UAE?.Total || 0)} />
        </Panel>

        <Panel title="International">
          <Row label="Local" value={formatInt(baseMatrix.International?.Local || 0)} />
          <Row label="International" value={formatInt(baseMatrix.International?.International || 0)} />
          <Row label="Total" value={formatInt(baseMatrix.International?.Total || 0)} />
        </Panel>
      </div>

      <SectionTitle title="Geographic Demand" />

      <Panel title="UAE emirates">
        {uaeEmiratesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
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
      </Panel>

      <Panel title="UAE emirate demand intensity">
        <UAEEmiratesMap data={uaeHeatmapData} />
      </Panel>

      <Panel title="International countries">
        {countriesRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
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
      </Panel>

      <SectionTitle title="Sector Demand" />

      <Panel title="Top sectors">
        {topSectorRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {topSectorRows.map((s, i) => (
              <BarRow key={i} label={s.sector} value={s.count} max={sectorMax} />
            ))}
          </div>
        )}
      </Panel>

      <SectionTitle title="Activity Demand" />

      <Panel title="Top activities">
        {topActivityRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {topActivityRows.map((a) => (
              <Row key={a.activity_id} label={a.activity_name} value={formatInt(a.count)} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function Empty() {
  return <div className="text-sm text-gray-500">No data yet.</div>;
}

function TableRow4({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b py-2 text-sm">
      <div className="min-w-0 truncate text-gray-700">{a}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{b}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{c}</div>
      <div className="text-right font-semibold text-gray-900 w-16">{d}</div>
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
