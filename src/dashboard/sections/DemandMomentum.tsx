import React from "react";
import { BarRow } from "../components/BarRow";
import { Panel } from "../components/Panel";

type MomentumItem = {
  label: string;
  value: number;
};

type Props = {
  sectors: MomentumItem[];
  regions: MomentumItem[];
};

export default function DemandMomentum({ sectors, regions }: Props) {
  const sectorMax = sectors[0]?.value || 1;
  const regionMax = regions[0]?.value || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel
        title="Fastest growing sectors"
        subtitle="Based on current selected time window"
      >
        {sectors.length === 0 ? (
          <div className="text-sm text-gray-500">No data yet.</div>
        ) : (
          <div className="space-y-2">
            {sectors.map((s, i) => (
              <BarRow key={i} label={s.label} value={s.value} max={sectorMax} />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Fastest growing regions"
        subtitle="Expansion demand signals"
      >
        {regions.length === 0 ? (
          <div className="text-sm text-gray-500">No data yet.</div>
        ) : (
          <div className="space-y-2">
            {regions.map((r, i) => (
              <BarRow key={i} label={r.label} value={r.value} max={regionMax} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}