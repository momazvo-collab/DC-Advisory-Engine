import React from "react";

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pt-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">
        {title}
      </div>
      {subtitle ? (
        <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
      ) : null}
    </div>
  );
}