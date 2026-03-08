import React from "react";

import { Panel } from "../../dashboard/components/Panel";
import { SectionTitle } from "../../dashboard/components/SectionTitle";
import RegionSectorHeatmap from "../../dashboard/visualizations/RegionSectorHeatmap";
import UAEEmiratesMap from "../../dashboard/visualizations/UAEEmiratesMap";

export default function DemandSection({
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
  return (
    <>
      {/* UAE Conversion Intelligence */}
      <SectionTitle
        title="Other Emirates Demand"
        subtitle="Other emirates showing demand — a pipeline for Dubai Chambers membership conversion."
      />

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

      <SectionTitle
        title="UAE emirate demand heatmap"
        subtitle="Demand signals across UAE emirates outside Dubai."
      />

      <Panel title="UAE emirate demand intensity">
        <UAEEmiratesMap data={uaeHeatmapData} />
      </Panel>

      {/* International Inbound Intelligence */}
      <SectionTitle
        title="International Demand"
        subtitle="Foreign businesses requesting advisory support related to Dubai."
      />

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
