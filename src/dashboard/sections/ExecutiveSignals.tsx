import React from "react";
import InsightCard from "../components/InsightCard";

type Signal = {
  label: string;
  value: string;
};

type Props = {
  signals: Signal[];
};

export default function ExecutiveSignals({ signals }: Props) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-gray-500">
        Key signals
      </div>

      <div className="text-sm text-gray-600 mt-1 mb-4">
        What leadership reads first (auto-computed from current data)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((s, i) => (
          <InsightCard key={i} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
}