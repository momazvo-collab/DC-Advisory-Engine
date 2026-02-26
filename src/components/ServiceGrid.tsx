import React from "react";
import { Card, CardContent } from "./ui";

export function ServiceGrid({ services }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {services.map((service: any) => (
        <Card key={service.id} className="rounded-2xl shadow-sm border border-[#E2E8F0] bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#003B5C] mb-1">{service.title}</h3>
            <p className="text-sm text-gray-600">Service eligibility preview.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
