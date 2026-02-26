import React from "react";
import { Card, CardContent, Button } from "./ui";
import { ServiceGrid } from "./ServiceGrid";
import { REGION_OFFICES } from "../data/regionOffices";

export function StepServices({ services, location, scope, region, activity, onBack }: any) {
  const commerceServices = services.filter((s: any) => s.category === "commerce");
  const localServices = services.filter((s: any) => s.category === "local");
  const internationalServices = services.filter((s: any) => s.category === "international");
  const membershipServices = services.filter((s: any) => s.category === "membership");

  const regionCountries = region ? (REGION_OFFICES as any).find((r: any) => r.name === region)?.countries || [] : [];

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold text-[#003B5C]">Eligible Services</h2>

      <div className="flex flex-wrap gap-3">
        {location?.base && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{location.base}</div>}
        {scope && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{scope}</div>}
        {activity && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{activity.activity_name}</div>}
      </div>

      {activity && (
        <div className="border border-[#E2E8F0] rounded-2xl p-6 bg-blue-50">
          <div className="text-xs text-gray-600">Selected Activity</div>
          <div className="text-lg font-semibold text-[#003B5C] mt-1">{activity.activity_name}</div>
          <div className="text-sm text-gray-600 mt-1">{activity.sector} • {activity.subsector}</div>
        </div>
      )}

      {membershipServices.length > 0 && (
        <div className="border border-[#0077B6] rounded-2xl p-6 bg-white shadow-sm">
          <div className="text-lg font-semibold text-[#003B5C]">Become a Member of Dubai Chambers</div>
          <p className="text-sm text-gray-600 mt-2">Businesses not registered in Dubai must obtain Dubai Chambers membership to access certain services.</p>
          <Button className="mt-4 bg-[#0077B6] hover:bg-[#005F8A]">Become a Member</Button>
        </div>
      )}

      {commerceServices.length > 0 && (
        <div className="rounded-2xl border border-[#800020] bg-[#FAF2F4] p-6">
          <h3 className="text-xl font-semibold text-[#800020] mb-4">Dubai Chambers – Commerce</h3>
          <ServiceGrid services={commerceServices} />
        </div>
      )}

      {scope === "Local" && localServices.length > 0 && (
        <div className="rounded-2xl border border-[#0077B6] bg-[#E6F4FA] p-6">
          <h3 className="text-xl font-semibold text-[#0077B6] mb-4">Dubai Chambers – Digital</h3>
          <ServiceGrid services={localServices} />
        </div>
      )}

      {scope === "International" && internationalServices.length > 0 && (
        <div className="rounded-2xl border border-[#2E8B57] bg-[#EAF7EF] p-6">
          <h3 className="text-xl font-semibold text-[#2E8B57] mb-2">Dubai Chambers – International</h3>

          {region && (
            <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full bg-white border border-[#2E8B57] text-sm font-medium text-[#2E8B57]">
              Target Region: {region}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {internationalServices.map((service: any) => (
              <Card key={service.id} className="rounded-2xl border border-[#E2E8F0] hover:shadow-md transition-all bg-white">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-[#003B5C] mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Service eligibility based on selected business profile.</p>

                  {service.id === "dubai_global" && region && regionCountries.length > 0 && (
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-[#2E8B57] mb-3">Supported Countries in {region}</div>
                      <div className="flex flex-wrap gap-2">
                        {regionCountries.map((country: any) => (
                          <div key={country.code} className="px-3 py-1 rounded-full bg-[#EAF7EF] text-sm text-[#2E8B57] border border-[#CDEBD8]">{country.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
}
