import React, { useMemo, useReducer, useState } from "react";
import { Card, CardContent } from "./components/ui";
import { StepIndicator } from "./components/StepIndicator";
import { StepLocation } from "./components/StepLocation";
import { StepScope } from "./components/StepScope";
import { StepRegion } from "./components/StepRegion";
import { StepActivity } from "./components/StepActivity";
import { StepServices } from "./components/StepServices";
import { resolveServicesForUI } from "./engine/resolveServices";

const initialState: any = { location: { base: null, emirate: "", country: "" }, scope: null, region: null, activity: null };

function reducer(state: any, action: any) {
  switch (action.type) {
    case "SET_LOCATION_BASE": {
      const base = action.payload;
      return { location: { base, emirate: "", country: "" }, scope: null, region: null, activity: null };
    }
    case "SET_LOCATION_EMIRATE":
      return { ...state, location: { ...state.location, emirate: action.payload } };
    case "SET_LOCATION_COUNTRY":
      return { ...state, location: { ...state.location, country: action.payload } };
    case "SET_SCOPE":
      return { ...state, scope: action.payload, region: null, activity: null };
    case "SET_REGION":
      return { ...state, region: action.payload };
    case "SET_ACTIVITY":
      return { ...state, activity: action.payload };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

export default function App() {
  const [step, setStep] = useState(1);
  const [formState, dispatch] = useReducer(reducer, initialState);

  const totalSteps = formState.scope === "International" ? 5 : 4;
  const stepLabels = formState.scope === "International"
    ? ["Location", "Scope", "Region", "Activity", "Services"]
    : ["Location", "Scope", "Activity", "Services"];

  const resolvedServices = useMemo(() => {
    if (step !== totalSteps) return [];
    const { location, scope, activity } = formState;
    if (!location?.base || !scope || !activity) return [];
    return resolveServicesForUI({ location, scope, activity });
  }, [step, formState, totalSteps]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans">
      <div className="bg-[#003B5C] text-white px-6 sm:px-10 lg:px-12 py-8 shadow-md sticky top-0 z-50">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-wide">Dubai Chambers Advisory Engine</h1>
        <p className="text-sm opacity-80 mt-2">Identify the right services based on your business profile</p>
      </div>

      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-12">
        <Card className="rounded-2xl shadow-lg border border-[#E2E8F0] bg-white">
          <CardContent className="p-6 sm:p-8 lg:p-12">
            <StepIndicator step={step} totalSteps={totalSteps} labels={stepLabels} />

            {step === 1 && (
              <StepLocation
                value={formState.location}
                onSetBase={(val: any) => dispatch({ type: "SET_LOCATION_BASE", payload: val })}
                onSetEmirate={(val: any) => dispatch({ type: "SET_LOCATION_EMIRATE", payload: val })}
                onSetCountry={(val: any) => dispatch({ type: "SET_LOCATION_COUNTRY", payload: val })}
                onNext={() => setStep((p) => p + 1)}
              />
            )}

            {step === 2 && (
              <StepScope
                value={formState.scope}
                onSelect={(val: any) => dispatch({ type: "SET_SCOPE", payload: val })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {step === 3 && formState.scope === "International" && (
              <StepRegion
                value={formState.region}
                onSelect={(val: any) => dispatch({ type: "SET_REGION", payload: val })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {(
              (step === 3 && formState.scope !== "International") ||
              (step === 4 && formState.scope === "International")
            ) && (
              <StepActivity
                value={formState.activity?.activity_name || ""}
                onChange={(activityObj: any) => dispatch({ type: "SET_ACTIVITY", payload: activityObj })}
                onNext={() => setStep((p) => p + 1)}
                onBack={() => setStep((p) => p - 1)}
              />
            )}

            {step === totalSteps && (
              <StepServices
                services={resolvedServices}
                location={formState.location}
                scope={formState.scope}
                region={formState.region}
                activity={formState.activity}
                onBack={() => setStep((p) => p - 1)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
