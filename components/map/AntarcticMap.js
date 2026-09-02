"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "proj4leaflet";
import { Maximize2, Minimize2 } from "lucide-react";

// Antarctic Polar Stereographic Projection
const antarcticCRS = new L.Proj.CRS(
  "EPSG:3031",
  "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 " +
    "+k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
  {
    origin: [-4194304, 4194304],

    resolutions: [
      8192,
      4096,
      2048,
      1024,
      512,
      256,
      128,
      64,
      32,
      16,
      8,
      4,
      2,
      1,
      0.5,
      0.25,
      0.125,
      0.0625,
    ],
  }
);

// Important Antarctic locations for HIMYANTRA
const antarcticLocations = [
  {
    name: "McMurdo Station",
    position: [-77.8419, 166.6863],
  },
  {
    name: "Amundsen-Scott South Pole Station",
    position: [-90, 0],
  },
  {
    name: "Rothera Research Station",
    position: [-67.5681, -68.1300],
  },
  {
    name: "Davis Research Station",
    position: [-68.5766, 77.9674],
  },
  {
    name: "Mawson Research Station",
    position: [-67.6027, 62.8797],
  },
  {
    name: "Casey Research Station",
    position: [-66.2821, 110.5276],
  },
  {
    name: "Vostok Station",
    position: [-78.4645, 106.8340],
  },
  {
    name: "Neumayer Station",
    position: [-70.6730, -8.2740],
  },
];

// Custom location marker
const locationIcon = L.divIcon({
  className: "antarctic-location-marker",
  html: `
    <div style="
      width: 10px;
      height: 10px;
      background: #67e8f9;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(103,232,249,0.8);
    "></div>
  `,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function AntarcticMap() {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Resize Leaflet map when fullscreen mode changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((previous) => !previous);
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen bg-slate-950 p-4"
          : "relative h-[500px] w-full overflow-hidden rounded-xl"
      }
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-950/90 text-cyan-300 shadow-lg backdrop-blur transition hover:bg-slate-800"
          title={isFullscreen ? "Exit fullscreen" : "Maximize map"}
        >
          {isFullscreen ? (
            <Minimize2 size={18} />
          ) : (
            <Maximize2 size={18} />
          )}
        </button>

        <MapContainer
          center={[-82, 0]}
          zoom={2}
          minZoom={1}
          maxZoom={8}
          crs={antarcticCRS}
          className="h-full w-full"
          zoomControl={true}
          ref={mapRef}
        >
          {/* NASA Antarctic Basemap */}
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/{z}/{y}/{x}.jpeg"
            attribution="NASA GIBS"
            tileSize={512}
            noWrap={true}
          />

          {/* Antarctic Locations */}
          {antarcticLocations.map((location) => (
            <Marker
              key={location.name}
              position={location.position}
              icon={locationIcon}
            >
              <Tooltip
                permanent
                direction="top"
                offset={[0, -8]}
                className="antarctic-tooltip"
              >
                {location.name}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        {/* Projection Information */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-slate-400 backdrop-blur">
          EPSG:3031 • Antarctic Polar Projection
        </div>
      </div>
    </div>
  );
}
