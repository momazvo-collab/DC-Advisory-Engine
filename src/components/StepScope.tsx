import React from "react";
import { Button } from "./ui";

export function StepScope({ value, onSelect, onNext, onBack }: any) {
  const canProceed = value !== null;
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-[#003B5C]">2. Select Support Scope</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["Local", "International"].map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${value === item ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}
          >
            <div className="font-medium text-[#003B5C]">{item} Support</div>
            <div className="text-xs text-gray-600 mt-1">
              {item === "Local" ? "Services and support within Dubai / UAE context" : "International expansion and market support"}
            </div>
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
