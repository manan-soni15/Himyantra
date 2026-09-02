"use client";

import { MapContainer, TileLayer } from "react-leaflet";

export default function AntarcticMap() {
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden">
      <MapContainer
        center={[-75, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
      </MapContainer>
    </div>
  );
}