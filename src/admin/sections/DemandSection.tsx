import React from "react";

import type { ActivityBreakdown, SectorDemand } from "../intelligence/demandAggregations";

type JurisdictionKey = "Dubai" | "OtherEmirates" | "International";

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Metric label="Total" value={formatInt(overallTotals.total)} />
        <Metric label="Local" value={formatInt(overallTotals.local)} />
        <Metric label="International" value={formatInt(overallTotals.international)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Insight label="Top overall sector" value={topOverallSector?.sector ?? "—"} />
        <Insight label="Top overall activity" value={topOverallActivity?.activity_name ?? "—"} />
        <Insight label="Top overall region" value={topOverallRegion?.region ?? "—"} />
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
      <button type="button" onClick={() => onSelect("Dubai")} className="text-left">
        <Card title="Dubai">
          <div className="grid grid-cols-3 gap-4">
            <MiniMetric label="Total" value={formatInt(totals.Dubai.total)} />
            <MiniMetric label="Local" value={formatInt(totals.Dubai.local)} />
            <MiniMetric label="International" value={formatInt(totals.Dubai.international)} />
          </div>
        </Card>
      </button>

      <button type="button" onClick={() => onSelect("OtherEmirates")} className="text-left">
        <Card title="Other Emirates">
          <div className="grid grid-cols-3 gap-4">
            <MiniMetric label="Total" value={formatInt(totals.OtherEmirates.total)} />
            <MiniMetric label="Local" value={formatInt(totals.OtherEmirates.local)} />
            <MiniMetric label="International" value={formatInt(totals.OtherEmirates.international)} />
          </div>
        </Card>
      </button>

      <button type="button" onClick={() => onSelect("International")} className="text-left">
        <Card title="International">
          <div className="grid grid-cols-3 gap-4">
            <MiniMetric label="Total" value={formatInt(totals.International.total)} />
            <MiniMetric label="Local" value={formatInt(totals.International.local)} />
            <MiniMetric label="International" value={formatInt(totals.International.international)} />
          </div>
        </Card>
      </button>
    </div>
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
  formatInt: (v: number) => string;
}) {
  const title =
    jurisdiction === "OtherEmirates" ? "Other Emirates" : jurisdiction === "International" ? "International" : "Dubai";

  const totals =
    jurisdiction === "Dubai"
      ? jurisdictionTotals.Dubai
      : jurisdiction === "OtherEmirates"
        ? emirateTotalsByScope[selectedEmirate] || emirateTotalsByScope.All
        : countryTotalsByScope[selectedCountry] || countryTotalsByScope["All Countries"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">Demand Intelligence</div>
          <div className="mt-1 text-xl font-semibold text-[#003B5C]">{title}</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Metric label="Total" value={formatInt(totals.total)} />
          <Metric label="Local" value={formatInt(totals.local)} />
          <Metric label="International" value={formatInt(totals.international)} />
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Local Scope">
          <div className="text-xs uppercase tracking-wider text-gray-500">Overall rankings</div>
          <RankingList
            rows={overallTopSectors.map((s) => ({ label: s.sector, value: formatInt(s.count) }))}
            emptyLabel="No sector data yet."
          />
          <RankingList
            rows={overallTopActivities.map((a) => ({ label: a.activity_name || a.activity_id, value: formatInt(a.count) }))}
            emptyLabel="No activity data yet."
          />
        </Card>

        <Card title="International Scope">
          <div className="text-xs uppercase tracking-wider text-gray-500">Overall rankings</div>
          <RankingList
            rows={overallTopSectors.map((s) => ({ label: s.sector, value: formatInt(s.count) }))}
            emptyLabel="No sector data yet."
          />
          <RankingList
            rows={overallTopActivities.map((a) => ({ label: a.activity_name || a.activity_id, value: formatInt(a.count) }))}
            emptyLabel="No activity data yet."
          />
          <div>
            <div className="mt-2 text-xs uppercase tracking-wider text-gray-500">Top regions</div>
            <RankingList
              rows={internationalTopRegionsAll.map((r) => ({ label: r.region, value: formatInt(r.count) }))}
              emptyLabel="No region data yet."
            />
          </div>
        </Card>
      </div>
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
            className={`px-3 py-1.5 text-sm rounded-lg border border-[#E6ECF2] ${
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold text-[#003B5C] tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-[#003B5C] tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">{label}</div>
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
