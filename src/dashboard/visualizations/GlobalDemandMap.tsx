import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography
} from "react-simple-maps";

type LocationData = {
  location_base: string | null;
  country: string | null;
  count: number;
};

type Props = {
  data: LocationData[];
};

const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

/* ISO → Country name fallback */
const isoMap: Record<string, string> = {
  AE: "United Arab Emirates",
  US: "United States of America",
  UK: "United Kingdom"
};

export default function GlobalDemandMap({ data }: Props) {

  const inbound = data.filter(
    (d) => d.location_base === "International" && d.country
  );

  const countryCounts: Record<string, number> = {};

  inbound.forEach((d) => {

    if (!d.country) return;

    const name = isoMap[d.country] || d.country;

    if (!countryCounts[name]) {
      countryCounts[name] = 0;
    }

    countryCounts[name] += d.count;
  });

  const max = Math.max(...Object.values(countryCounts), 1);

  function colorScale(value: number) {
    const intensity = value / max;
    const shade = Math.floor(255 - intensity * 160);
    return `rgb(${shade}, ${shade}, 255)`;
  }

  return (
    <div className="w-full overflow-x-auto">
      <ComposableMap projectionConfig={{ scale: 140 }}>
        <Geographies geography={geoUrl}>
         {({ geographies }: any) =>
  geographies.map((geo: any) => {

              const countryName = geo.properties.name;

              const value = countryCounts[countryName] || 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={value ? colorScale(value) : "#EEE"}
                  stroke="#DDD"
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#003B5C", outline: "none" },
                    pressed: { outline: "none" }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}