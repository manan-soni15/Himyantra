"use client";

import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import { researchStations } from "@/data/researchStations";

export default function ResearchStationsLayer() {
  return (
    <>
      {researchStations.map((station) => {
        const isIndia = station.country === "India";
        const lat = station.lat;
        const lon = station.lon ?? station.lng;

        return (
          <CircleMarker
            key={station.id || station.name}
            center={[lat, lon]}
            radius={isIndia ? 7 : 5}
            pathOptions={{
              color: "#22d3ee",
              weight: 2,
              fillColor: isIndia ? "#22d3ee" : "#f8fafc",
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>
              {station.name}
            </Tooltip>

            <Popup>
              <div
                style={{
                  minWidth: "230px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    marginBottom: "4px",
                  }}
                >
                  {station.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginBottom: "12px",
                  }}
                >
                  {station.country}
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "10px",
                    fontSize: "12px",
                    lineHeight: "1.7",
                  }}
                >
                  <div>
                    <strong>Coordinates:</strong>{" "}
                    {lat.toFixed(3)}°,{" "}
                    {lon.toFixed(3)}°
                  </div>

                  {station.region && (
                    <div>
                      <strong>Region:</strong> {station.region}
                    </div>
                  )}

                  <div>
                    <strong>Status:</strong> {station.status}
                  </div>

                  {station.focus && (
                    <div style={{ marginTop: "8px" }}>
                      <strong>Research:</strong>
                      <br />
                      {station.focus}
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}