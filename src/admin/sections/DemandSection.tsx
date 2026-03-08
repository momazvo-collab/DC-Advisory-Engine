import React from "react";

import { Panel } from "../../dashboard/components/Panel";
import { BarRow } from "../../dashboard/components/BarRow";
import { Row } from "../../dashboard/components/Row";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import RegionSectorHeatmap from "../../dashboard/visualizations/RegionSectorHeatmap";
import UAEEmiratesMap from "../../dashboard/visualizations/UAEEmiratesMap";

import { normalizeKey, safeNum, topN } from "../../dashboard/utils/formatters";

import type { ActivityBreakdown, DetailedLocation, SectorDemand } from "../intelligence/demandAggregations";

export default function DemandSection({
  baseMatrix,
  detailedLocation,
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
  heatmapData,
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
  const dubaiOutboundRegions = (() => {
    const m = new Map<string, number>();
    for (const r of detailedLocation || []) {
      if (normalizeKey(r.location_base) !== "Dubai") continue;
      if (normalizeKey(r.scope) !== "International") continue;

      const region = normalizeKey(r.region);
      m.set(region, (m.get(region) || 0) + safeNum(r.count));
    }

    return [...m.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const topSectorRows = topN(sectorDemand || [], 10, (s) => safeNum(s.count));
  const sectorMax = safeNum(topSectorRows[0]?.count) || 1;

  const topActivityRows = topN(activityBreakdown || [], 10, (a) => safeNum(a.count));

  return (
    <>
      <SectionTitle title="Demand Intelligence" subtitle="Jurisdiction → Geography → Sector → Activity" />

      <SectionTitle title="Jurisdiction Overview" subtitle="Local vs International scope demand within each jurisdiction." />

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

      <SectionTitle title="Geographic Demand" subtitle="Geographic distribution of demand signals by jurisdiction." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Dubai outbound expansion regions">
          {dubaiOutboundRegions.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2">
              {dubaiOutboundRegions.slice(0, 10).map((r, i) => (
                <BarRow key={i} label={r.region} value={r.count} max={dubaiOutboundRegions[0]?.count || 1} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Demand by UAE emirate">
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
      </div>

      <Panel title="UAE emirate demand intensity">
        <UAEEmiratesMap data={uaeHeatmapData} />
      </Panel>

      <Panel title="International Demand by country">
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

      <SectionTitle title="Sector Demand" subtitle="Top sectors globally." />

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

      <SectionTitle title="Activity Demand" subtitle="Top activities globally." />

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

      {/*
<SectionTitle
  title="International demand map"
  subtitle="Global distribution of businesses interested in Dubai."
/>

<Panel title="Global demand map">
  <GlobalDemandMap data={worldMapData} />
</Panel>
*/}

      {/*
<SectionTitle
  title="Expansion intelligence"
  subtitle="Option B: Region → Sector, with expandable activities (activities shown are sector-level overall until region-activity RPC is added)."
/>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <RegionSectorBlock
    blockKey="dubai-expansion"
    title="Dubai companies seeking expansion"
    subtitle="Filtered to Dubai + scope=International. Regions are Dubai-specific."
    regions={dubaiExpansionRegions}
  />

  <RegionSectorBlock
    blockKey="uae-expansion"
    title="UAE (other emirates) seeking expansion"
    subtitle="Filtered to UAE + scope=International. Regions are UAE-specific."
    regions={uaeExpansionRegions}
  />
</div>
*/}

      <SectionTitle
        title="Region → Sector demand heatmap"
        subtitle="Visual intensity of sector demand by expansion region."
      />

      <Panel title="Region sector demand matrix">
        <RegionSectorHeatmap data={heatmapData} />
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
