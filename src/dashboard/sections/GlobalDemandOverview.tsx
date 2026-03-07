import { Panel } from "../components/Panel";
import { BarRow } from "../components/BarRow";
import { Empty } from "../components/Empty";

type Props = {
  sectorOverallSorted: { sector: string; count: number }[];
  regionDemandSorted: { region: string; count: number }[];
  activityBreakdown: { activity_id: string; sector: string; count: number }[];
  formatInt: (n: number) => string;
};

export default function GlobalDemandOverview({
  sectorOverallSorted,
  regionDemandSorted,
}: Props) {

  const sectorMax = sectorOverallSorted?.[0]?.count ?? 1;
  const regionMax = regionDemandSorted?.[0]?.count ?? 1;

  const noSectorData = !sectorOverallSorted || sectorOverallSorted.length === 0;
  const noRegionData = !regionDemandSorted || regionDemandSorted.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Top Sectors */}
      <Panel title="Top sectors (overall)">
        {noSectorData ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {sectorOverallSorted.map((s) => (
              <BarRow
                key={s.sector}
                label={s.sector}
                value={s.count}
                max={sectorMax}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* Top Expansion Regions */}
      <Panel title="Top expansion regions (overall)">
        {noRegionData ? (
          <Empty />
        ) : (
          <div className="space-y-2">
            {regionDemandSorted.map((r) => (
              <BarRow
                key={r.region}
                label={r.region}
                value={r.count}
                max={regionMax}
              />
            ))}
          </div>
        )}
      </Panel>

    </div>
  );
}