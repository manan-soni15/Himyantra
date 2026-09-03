"use client";

import { WMSTileLayer } from "react-leaflet";

export default function SeaIceLayer() {
  return (
    <WMSTileLayer
      url="https://gibs.earthdata.nasa.gov/wms/epsg3031/best/wms.cgi"
      params={{
        layers: "AMSRU2_Sea_Ice_Concentration_25km",
        format: "image/png",
        transparent: true,
        version: "1.1.1",
        styles: "default",
        time: "default",
      }}
      opacity={0.50}
      attribution="NASA GIBS / AMSR2"
    />
  );
}