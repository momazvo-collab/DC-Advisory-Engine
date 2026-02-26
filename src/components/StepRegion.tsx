import React from "react";
import { Button } from "./ui";
import { REGION_OFFICES } from "../data/regionOffices";

export function StepRegion({ value, onSelect, onNext, onBack }: any) {
  const regions = (REGION_OFFICES as any).map((r: any) => r.name);
  const canProceed = !!value;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-[#003B5C]">2.5 Select Target Region</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((r: string) => (
          <div
            key={r}
            onClick={() => onSelect(r)}
            className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${value === r ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}
          >
            <div className="font-medium text-[#003B5C]">{r}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button disabled={!canProceed} onClick={onNext} className="sm:ml-auto">Continue</Button>
      </div>
    </div>
  );
}
