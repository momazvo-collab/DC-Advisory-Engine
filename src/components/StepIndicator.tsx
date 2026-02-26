import React from "react";

type Props = {
  step: number;
  totalSteps: number;
  labels: string[];
};

export function StepIndicator({ step, totalSteps, labels }: Props) {
  return (
    <div className="mb-12">
      <div className="hidden md:flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex-1 text-center">
            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s ? "bg-[#0077B6] text-white" : "bg-gray-200 text-gray-600"}`}>{s}</div>
            <div className="text-xs mt-2 text-gray-600 font-medium">{labels[s - 1] || ""}</div>
          </div>
        ))}
      </div>
      <div className="md:hidden text-center text-sm font-medium text-gray-600">Step {step} of {totalSteps}</div>
    </div>
  );
}
