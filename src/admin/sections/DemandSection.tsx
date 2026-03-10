import React from "react";

import type { ActivityBreakdown, SectorDemand } from "../intelligence/demandAggregations";

type JurisdictionKey = "Dubai" | "OtherEmirates" | "International";
type RankingItem = { label: string; count: number };
type ScopeBreakdown = { local: RankingItem[]; international: RankingItem[] };

export default function DemandSection({
  overallTotals,
  topOverallSector,
  topOverallActivity,
  topOverallRegion,
  jurisdictionTotals,
  countryOptions,
  emirateTotalsByScope,
  countryTotalsByScope,
  internationalTopRegionsAll,
  overallTopSectors,
  overallTopActivities,
  sectorRankings,
  activityRankings,
  regionRankings,
  formatInt,
}: {
  overallTotals: { total: number; local: number; international: number };
  topOverallSector: SectorDemand | null;
  topOverallActivity: ActivityBreakdown | null;
  topOverallRegion: { region: string; count: number } | null;
  jurisdictionTotals: {
    Dubai: { total: number; local: number; international: number };
    OtherEmirates: { total: number; local: number; international: number };
    International: { total: number; local: number; international: number };
  };
  countryOptions: string[];
  emirateTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  countryTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  internationalTopRegionsAll: { region: string; count: number }[];
  overallTopSectors: SectorDemand[];
  overallTopActivities: ActivityBreakdown[];
  sectorRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  activityRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  regionRankings: {
    Dubai: RankingItem[];
    OtherEmirates: RankingItem[];
    countries: Record<string, RankingItem[]>;
  };
  formatInt: (v: number) => string;
}) {
  return (
    <>
      <SectionHeader>DEMAND INTELLIGENCE</SectionHeader>

      <DemandJurisdictionExplorer
        overallTotals={overallTotals}
        topOverallSector={topOverallSector}
        topOverallActivity={topOverallActivity}
        topOverallRegion={topOverallRegion}
        jurisdictionTotals={jurisdictionTotals}
        emirateTotalsByScope={emirateTotalsByScope}
        countryTotalsByScope={countryTotalsByScope}
        countryOptions={countryOptions}
        internationalTopRegionsAll={internationalTopRegionsAll}
        overallTopSectors={overallTopSectors}
        overallTopActivities={overallTopActivities}
        sectorRankings={sectorRankings}
        activityRankings={activityRankings}
        regionRankings={regionRankings}
        formatInt={formatInt}
      >
        <TotalApplicationsCard
          overallTotals={overallTotals}
          topOverallSector={topOverallSector}
          topOverallActivity={topOverallActivity}
          topOverallRegion={topOverallRegion}
          formatInt={formatInt}
        />
      </DemandJurisdictionExplorer>
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#003B5C] tabular-nums">{value}</div>
    </div>
  );
}

function IntelligenceBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[#003B5C] truncate">{value}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100" />;
}

function TotalApplicationsCard({
  overallTotals,
  topOverallSector,
  topOverallActivity,
  topOverallRegion,
  showBreakdown,
  onToggleBreakdown,
  formatInt,
}: {
  overallTotals: { total: number; local: number; international: number };
  topOverallSector: SectorDemand | null;
  topOverallActivity: ActivityBreakdown | null;
  topOverallRegion: { region: string; count: number } | null;
  showBreakdown?: boolean;
  onToggleBreakdown?: () => void;
  formatInt: (v: number) => string;
}) {
  return (
    <Card title="Total Applications">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricBox label="Total Applications" value={formatInt(overallTotals.total)} />
        <MetricBox label="Local Applications" value={formatInt(overallTotals.local)} />
        <MetricBox label="International Applications" value={formatInt(overallTotals.international)} />
      </div>

      <Divider />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <IntelligenceBlock label="Top Sector" value={topOverallSector?.sector ?? "—"} />
        <IntelligenceBlock label="Top Activity" value={topOverallActivity?.activity_name ?? "—"} />
        <IntelligenceBlock label="Top Expansion Region" value={topOverallRegion?.region ?? "—"} />
      </div>

      <div>
        <button
          type="button"
          onClick={onToggleBreakdown}
          className="px-4 py-2 text-sm rounded-lg border border-[#E6ECF2] bg-white text-gray-700 hover:bg-gray-50"
        >
          {showBreakdown ? "Hide Jurisdiction Breakdown" : "View Jurisdiction Breakdown"}
        </button>
      </div>
    </Card>
  );
}

function DemandJurisdictionExplorer({
  overallTotals,
  topOverallSector,
  topOverallActivity,
  topOverallRegion,
  jurisdictionTotals,
  emirateTotalsByScope,
  countryTotalsByScope,
  countryOptions,
  internationalTopRegionsAll,
  overallTopSectors,
  overallTopActivities,
  sectorRankings,
  activityRankings,
  regionRankings,
  formatInt,
  children,
}: {
  overallTotals: { total: number; local: number; international: number };
  topOverallSector: SectorDemand | null;
  topOverallActivity: ActivityBreakdown | null;
  topOverallRegion: { region: string; count: number } | null;
  jurisdictionTotals: Record<JurisdictionKey, { total: number; local: number; international: number }>;
  emirateTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  countryTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  countryOptions: string[];
  internationalTopRegionsAll: { region: string; count: number }[];
  overallTopSectors: SectorDemand[];
  overallTopActivities: ActivityBreakdown[];
  sectorRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  activityRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  regionRankings: {
    Dubai: RankingItem[];
    OtherEmirates: RankingItem[];
    countries: Record<string, RankingItem[]>;
  };
  formatInt: (v: number) => string;
  children: React.ReactElement;
}) {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [activeJurisdiction, setActiveJurisdiction] = React.useState<JurisdictionKey | null>(null);
  const [selectedEmirate, setSelectedEmirate] = React.useState<
    "All" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain"
  >("All");
  const [selectedCountry, setSelectedCountry] = React.useState<string>("All Countries");

  React.useEffect(() => {
    if (!showBreakdown) {
      setActiveJurisdiction(null);
      setSelectedEmirate("All");
      setSelectedCountry("All Countries");
    }
  }, [showBreakdown]);

  const masterCard = React.cloneElement(children, {
    overallTotals,
    topOverallSector,
    topOverallActivity,
    topOverallRegion,
    showBreakdown,
    onToggleBreakdown: () => setShowBreakdown((v) => !v),
  });

  if (!showBreakdown) return masterCard;

  return (
    <div className="space-y-6">
      {masterCard}

      {activeJurisdiction === null ? (
        <JurisdictionSelectorRow
          totals={jurisdictionTotals}
          onSelect={(j) => setActiveJurisdiction(j)}
          formatInt={formatInt}
        />
      ) : (
        <DemandDetailView
          jurisdiction={activeJurisdiction}
          onBack={() => setActiveJurisdiction(null)}
          selectedEmirate={selectedEmirate}
          setSelectedEmirate={setSelectedEmirate}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          countryOptions={countryOptions}
          emirateTotalsByScope={emirateTotalsByScope}
          countryTotalsByScope={countryTotalsByScope}
          jurisdictionTotals={jurisdictionTotals}
          internationalTopRegionsAll={internationalTopRegionsAll}
          overallTopSectors={overallTopSectors}
          overallTopActivities={overallTopActivities}
          sectorRankings={sectorRankings}
          activityRankings={activityRankings}
          regionRankings={regionRankings}
          formatInt={formatInt}
        />
      )}
    </div>
  );
}

function JurisdictionSelectorRow({
  totals,
  onSelect,
  formatInt,
}: {
  totals: Record<JurisdictionKey, { total: number; local: number; international: number }>;
  onSelect: (j: JurisdictionKey) => void;
  formatInt: (v: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <JurisdictionCard
        title="Dubai"
        totals={totals.Dubai}
        onClick={() => onSelect("Dubai")}
        formatInt={formatInt}
      />

      <JurisdictionCard
        title="Other Emirates"
        totals={totals.OtherEmirates}
        onClick={() => onSelect("OtherEmirates")}
        formatInt={formatInt}
      />

      <JurisdictionCard
        title="International"
        totals={totals.International}
        onClick={() => onSelect("International")}
        formatInt={formatInt}
      />
    </div>
  );
}

function JurisdictionCard({
  title,
  totals,
  onClick,
  formatInt,
}: {
  title: string;
  totals: { total: number; local: number; international: number };
  onClick: () => void;
  formatInt: (v: number) => string;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <div className="rounded-xl border border-[#E6ECF2] bg-white shadow-sm p-6 hover:bg-gray-50">
        <div className="text-sm font-semibold text-[#003B5C]">{title}</div>
        <div className="mt-4 space-y-2">
          <div className="flex items-baseline justify-between gap-6">
            <div className="text-sm text-gray-600">Total Applications</div>
            <div className="text-lg font-semibold text-[#003B5C] tabular-nums">{formatInt(totals.total)}</div>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <div className="text-sm text-gray-600">Local Applications</div>
            <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatInt(totals.local)}</div>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <div className="text-sm text-gray-600">International Applications</div>
            <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatInt(totals.international)}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function DemandDetailView({
  jurisdiction,
  onBack,
  selectedEmirate,
  setSelectedEmirate,
  selectedCountry,
  setSelectedCountry,
  countryOptions,
  emirateTotalsByScope,
  countryTotalsByScope,
  jurisdictionTotals,
  internationalTopRegionsAll,
  overallTopSectors,
  overallTopActivities,
  sectorRankings,
  activityRankings,
  regionRankings,
  formatInt,
}: {
  jurisdiction: JurisdictionKey;
  onBack: () => void;
  selectedEmirate: "All" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain";
  setSelectedEmirate: React.Dispatch<
    React.SetStateAction<
      "All" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain"
    >
  >;
  selectedCountry: string;
  setSelectedCountry: React.Dispatch<React.SetStateAction<string>>;
  countryOptions: string[];
  emirateTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  countryTotalsByScope: Record<string, { total: number; local: number; international: number }>;
  jurisdictionTotals: Record<JurisdictionKey, { total: number; local: number; international: number }>;
  internationalTopRegionsAll: { region: string; count: number }[];
  overallTopSectors: SectorDemand[];
  overallTopActivities: ActivityBreakdown[];
  sectorRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  activityRankings: {
    Dubai: ScopeBreakdown;
    OtherEmirates: ScopeBreakdown;
    emirates: Record<string, ScopeBreakdown>;
    countries: Record<string, ScopeBreakdown>;
  };
  regionRankings: {
    Dubai: RankingItem[];
    OtherEmirates: RankingItem[];
    countries: Record<string, RankingItem[]>;
  };
  formatInt: (v: number) => string;
}) {
  const title =
    jurisdiction === "OtherEmirates" ? "Other Emirates" : jurisdiction === "International" ? "International" : "Dubai";

  const totalsKey =
    jurisdiction === "Dubai" ? "Dubai" : jurisdiction === "OtherEmirates" ? selectedEmirate : selectedCountry;

  const totals =
    jurisdiction === "Dubai"
      ? jurisdictionTotals.Dubai
      : jurisdiction === "OtherEmirates"
        ? emirateTotalsByScope[selectedEmirate] || emirateTotalsByScope.All
        : countryTotalsByScope[selectedCountry] || countryTotalsByScope["All Countries"];

  const hasApplications = totals.total > 0;
  const rankingSource =
    jurisdiction === "Dubai"
      ? {
          sectors: sectorRankings.Dubai,
          activities: activityRankings.Dubai,
          regions: regionRankings.Dubai,
        }
      : jurisdiction === "OtherEmirates"
        ? selectedEmirate === "All"
          ? {
              sectors: sectorRankings.OtherEmirates,
              activities: activityRankings.OtherEmirates,
              regions: regionRankings.OtherEmirates,
            }
          : {
              sectors: sectorRankings.emirates[selectedEmirate] || { local: [], international: [] },
              activities: activityRankings.emirates[selectedEmirate] || { local: [], international: [] },
              regions: regionRankings.OtherEmirates,
            }
        : selectedCountry === "All Countries"
          ? {
              sectors: { local: [], international: [] },
              activities: { local: [], international: [] },
              regions: internationalTopRegionsAll.slice(0, 3).map((r) => ({ label: r.region, count: r.count })),
            }
          : {
              sectors: sectorRankings.countries[selectedCountry] || { local: [], international: [] },
              activities: activityRankings.countries[selectedCountry] || { local: [], international: [] },
              regions: regionRankings.countries[selectedCountry] || [],
            };

  const localSectorRows = rankingSource.sectors.local.map((r) => ({ label: r.label, value: formatInt(r.count) }));
  const localActivityRows = rankingSource.activities.local.map((r) => ({ label: r.label, value: formatInt(r.count) }));
  const internationalSectorRows = rankingSource.sectors.international.map((r) => ({ label: r.label, value: formatInt(r.count) }));
  const internationalActivityRows = rankingSource.activities.international.map((r) => ({ label: r.label, value: formatInt(r.count) }));
  const topRegions = rankingSource.regions.map((r) => ({ label: r.label, value: formatInt(r.count) }));
  const noRankingLabel = "No ranking data yet";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">Demand Intelligence</div>
          <div className="mt-1 text-xl font-semibold text-[#003B5C]">{title}</div>
          <div className="mt-1 text-sm text-gray-600">{totalsKey}</div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm rounded-lg border border-[#E6ECF2] bg-white text-gray-700 hover:bg-gray-50"
        >
          Back to Jurisdictions
        </button>
      </div>

      <Card title="Summary metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricBox label="Total Applications" value={formatInt(totals.total)} />
          <MetricBox label="Local Applications" value={formatInt(totals.local)} />
          <MetricBox label="International Applications" value={formatInt(totals.international)} />
        </div>

        {!hasApplications ? (
          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 text-sm text-gray-600">
            No applications yet
          </div>
        ) : null}
      </Card>

      {jurisdiction === "OtherEmirates" ? (
        <EmirateSelectorTabs selected={selectedEmirate} onSelect={setSelectedEmirate} />
      ) : null}

      {jurisdiction === "International" ? (
        <CountryDropdown
          selected={selectedCountry}
          onChange={setSelectedCountry}
          options={["All Countries", ...countryOptions]}
        />
      ) : null}

      {jurisdiction === "International" ? (
        <Card title="Intelligence">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <IntelligencePanel
              title="Top Sectors"
              rows={internationalSectorRows}
              emptyLabel={hasApplications ? noRankingLabel : "No applications yet"}
            />
            <IntelligencePanel
              title="Top Activities"
              rows={internationalActivityRows}
              emptyLabel={hasApplications ? noRankingLabel : "No applications yet"}
            />
            <IntelligencePanel
              title="Top Expansion Regions"
              rows={hasApplications ? topRegions : []}
              emptyLabel={hasApplications ? "No region data yet" : "No applications yet"}
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Local Applications">
            <div className="grid grid-cols-1 gap-4">
              <MetricBox label="Applications" value={formatInt(totals.local)} />
              <IntelligencePanel
                title="Top Sectors (Top 3)"
                rows={localSectorRows}
                emptyLabel={totals.local > 0 ? noRankingLabel : "No applications yet"}
              />
              <IntelligencePanel
                title="Top Activities (Top 3)"
                rows={localActivityRows}
                emptyLabel={totals.local > 0 ? noRankingLabel : "No applications yet"}
              />
            </div>
          </Card>

          <Card title="International Applications">
            <div className="grid grid-cols-1 gap-4">
              <MetricBox label="Applications" value={formatInt(totals.international)} />
              <IntelligencePanel
                title="Top Sectors (Top 3)"
                rows={internationalSectorRows}
                emptyLabel={totals.international > 0 ? noRankingLabel : "No applications yet"}
              />
              <IntelligencePanel
                title="Top Activities (Top 3)"
                rows={internationalActivityRows}
                emptyLabel={totals.international > 0 ? noRankingLabel : "No applications yet"}
              />
              <IntelligencePanel
                title="Top Expansion Regions (Top 3)"
                rows={hasApplications ? topRegions : []}
                emptyLabel={hasApplications ? "No region data yet" : "No applications yet"}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmirateSelectorTabs({
  selected,
  onSelect,
}: {
  selected: "All" | "Abu Dhabi" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain";
  onSelect: (v: any) => void;
}) {
  const opts = [
    "All",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Ras Al Khaimah",
    "Fujairah",
    "Umm Al Quwain",
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const active = o === selected;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            className={`px-3 py-2 text-sm rounded-lg border border-[#E6ECF2] ${
              active ? "bg-[#003B5C] text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function CountryDropdown({
  selected,
  onChange,
  options,
}: {
  selected: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-auto px-3 py-2 text-sm rounded-lg border border-[#E6ECF2] bg-white text-gray-700"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function RankingList({
  rows,
  emptyLabel,
}: {
  rows: { label: string; value: string }[];
  emptyLabel: string;
}) {
  if (!rows.length) return <div className="text-sm text-gray-500">{emptyLabel}</div>;
  return (
    <div className="divide-y divide-gray-100">
      {rows.slice(0, 10).map((r) => (
        <div key={`${r.label}-${r.value}`} className="flex items-center justify-between gap-6 py-2 text-sm">
          <div className="min-w-0 truncate text-gray-700">{r.label}</div>
          <div className="text-right font-semibold text-gray-900 tabular-nums">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function IntelligencePanel({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: { label: string; value: string }[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500">{title}</div>
      <div className="mt-3">
        <RankingList rows={rows.slice(0, 3)} emptyLabel={emptyLabel} />
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#003B5C] truncate">{value}</div>
    </div>
  );
}
