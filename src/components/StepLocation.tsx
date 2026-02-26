import React from "react";
import { Button } from "./ui";
import { UAE_EMIRATES } from "../data/uaeEmirates";
import { CountryAutocomplete } from "./CountryAutocomplete";

export function StepLocation({ value, onSetBase, onSetEmirate, onSetCountry, onNext }: any) {
  const base = value?.base;
  const emirate = value?.emirate;
  const country = value?.country;

  const needsEmirate = base === "UAE";
  const needsCountry = base === "International";

  const canProceed = base === "Dubai" || (needsEmirate && !!emirate) || (needsCountry && !!country);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#003B5C]">1. Select Business Location</h2>
          <p className="text-sm text-gray-600 mt-1">Choose where the business is registered or based.</p>
        </div>
        <Button variant="outline" onClick={() => onSetBase(null)} className="hidden sm:inline-flex">Clear</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{ label: "Dubai", value: "Dubai" },{ label: "UAE (Other Emirate)", value: "UAE" },{ label: "International", value: "International" }].map((item) => (
          <div
            key={item.value}
            onClick={() => onSetBase(item.value)}
            className={`rounded-2xl p-6 text-center cursor-pointer border transition-all ${base === item.value ? "border-[#0077B6] bg-blue-50" : "border-[#E2E8F0] hover:border-[#0077B6]"}`}
          >
            <div className="font-medium text-[#003B5C]">{item.label}</div>
          </div>
        ))}
      </div>

      {needsEmirate && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-[#003B5C]">Select Emirate</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {UAE_EMIRATES.filter((e) => e !== "Dubai").map((e) => (
              <div
                key={e}
                onClick={() => onSetEmirate(e)}
                className={`rounded-xl p-4 text-center cursor-pointer border transition-all text-sm font-medium ${emirate === e ? "border-[#0077B6] bg-blue-50 text-[#003B5C]" : "border-[#E2E8F0] hover:border-[#0077B6] text-gray-700"}`}
              >
                {e}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Dubai-based businesses should select “Dubai” above.</p>
        </div>
      )}

      {needsCountry && <CountryAutocomplete value={country} onSelect={(val: any) => onSetCountry(val)} />}

      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <Button variant="outline" onClick={() => onSetBase(null)} className="sm:hidden">Clear</Button>
        <Button disabled={!canProceed} onClick={onNext} className="sm:ml-auto">Continue</Button>
      </div>
    </div>
  );
}
