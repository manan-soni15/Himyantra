"use client";

import ResearchStationsLayer from "./ResearchStationsLayer";
import SeaIceLayer from "./SeaIceLayer";
import SeaIceLegend from "./SeaIceLegend";

import { useEffect, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "proj4leaflet";

import { Maximize2, Minimize2 } from "lucide-react";

import { icebergs } from "../../data/icebergs";
import { useVessel } from "../../context/VesselContext";

/* =========================================================
   Antarctic Polar Stereographic Projection
   EPSG:3031
========================================================= */

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

/* =========================================================
   Antarctic Research Locations
========================================================= */

const antarcticLocations = [
  {
    name: "McMurdo Station",
    position: [-77.8419, 166.6863],
    country: "United States",
  },
  {
    name: "Amundsen-Scott South Pole Station",
    position: [-90, 0],
    country: "United States",
  },
  {
    name: "Rothera Research Station",
    position: [-67.5681, -68.13],
    country: "United Kingdom",
  },
  {
    name: "Davis Research Station",
    position: [-68.5766, 77.9674],
    country: "Australia",
  },
  {
    name: "Mawson Research Station",
    position: [-67.6027, 62.8797],
    country: "Australia",
  },
  {
    name: "Casey Research Station",
    position: [-66.2821, 110.5276],
    country: "Australia",
  },
  {
    name: "Vostok Station",
    position: [-78.4645, 106.834],
    country: "Russia",
  },
  {
    name: "Neumayer Station",
    position: [-70.673, -8.274],
    country: "Germany",
  },
];

/* =========================================================
   Research Station Marker
========================================================= */

const locationIcon = L.divIcon({
  className: "antarctic-location-marker",
  html: `
    <div style="
      width: 11px;
      height: 11px;
      background: #22d3ee;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow:
        0 0 0 2px rgba(34,211,238,0.18),
        0 0 10px rgba(34,211,238,0.75);
    "></div>
  `,
  iconSize: [11, 11],
  iconAnchor: [5.5, 5.5],
});

/* =========================================================
   Research Vessel Marker
========================================================= */

const vesselIcon = L.divIcon({
  className: "vessel-marker",
  html: `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">

      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid rgba(34,211,238,0.7);
        animation: pulse 2s infinite;
      "></div>

      <div style="
        position: relative;
        font-size: 24px;
        filter: drop-shadow(0 0 7px rgba(34,211,238,0.9));
      ">
        🚢
      </div>

    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

/* =========================================================
   Iceberg Marker
========================================================= */

const icebergIcon = L.divIcon({
  className: "iceberg-marker",
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      font-size: 24px;
      filter: drop-shadow(0 0 6px rgba(34,211,238,0.9));
    ">
      🧊
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/* =========================================================
   Map View Controller for Dynamic Iceberg Auto-Centering
========================================================= */

function MapViewController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, Math.max(3, map.getZoom()), {
        animate: true,
        duration: 1.2,
      });
    }
  }, [center, map]);
  return null;
}

/* =========================================================
   Component
========================================================= */

export default function AntarcticMap({ activeTrajectory, activeIcebergId, showTrajectory = true }) {
  const mapRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const { activeVessel } = useVessel();

  // Compute map center target: active iceberg position if available, or vessel position
  const activeCenter = activeTrajectory?.currentPosition || activeTrajectory?.predictedPath?.[0] 
    ? [activeTrajectory.predictedPath[0].lat, activeTrajectory.predictedPath[0].lon]
    : activeVessel?.currentPosition || [-64, -55];

  /* =======================================================
     Active Vessel Telemetry
  ======================================================= */

  const vessel = {
    name: activeVessel.name,
    position: activeVessel.currentPosition,
    heading: "South-East",
    speed: `${activeVessel.maxSpeedKnots} knots`,
    status: activeVessel.status || "Navigating",
  };

  /* =======================================================
     Resize Leaflet map after fullscreen change
  ======================================================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  /* =======================================================
     Fullscreen Toggle
  ======================================================= */

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

        {/* =================================================
            Fullscreen Button
        ================================================= */}

        <button
          onClick={toggleFullscreen}
          className="
            absolute right-4 top-4 z-[1000]
            flex h-10 w-10 items-center justify-center
            rounded-lg
            border border-slate-200
            bg-white/95
            text-slate-600
            shadow-lg
            backdrop-blur
            transition
            hover:bg-slate-50
            hover:text-cyan-600
          "
          title={isFullscreen ? "Exit fullscreen" : "Maximize map"}
        >
          {isFullscreen ? (
            <Minimize2 size={18} />
          ) : (
            <Maximize2 size={18} />
          )}
        </button>

        {/* =================================================
            MAP
        ================================================= */}

        <MapContainer
          center={activeCenter}
          zoom={3}
          minZoom={1}
          maxZoom={8}
          crs={antarcticCRS}
          className="h-full w-full bg-[#0b131e]"
          zoomControl={true}
          ref={mapRef}
          style={{
            background: "#0b131e",
          }}
        >
          <MapViewController center={activeCenter} />

          {/* =================================================
              NASA ANTARCTIC BASEMAP

              Restored to full opacity so the ocean
              has the original blue appearance.
          ================================================= */}

          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/{z}/{y}/{x}.jpeg"
            attribution="NASA GIBS"
            tileSize={512}
            noWrap={true}
            opacity={1}
          />

          {/* =================================================
              POLAR LATITUDE RINGS

              80°S
              70°S
              60°S
          ================================================= */}

          <Circle
            center={[-90, 0]}
            radius={1112000}
            pathOptions={{
              color: "#94a3b8",
              weight: 1,
              opacity: 0.25,
              fill: false,
              dashArray: "4 7",
            }}
          />

          <Circle
            center={[-90, 0]}
            radius={2224000}
            pathOptions={{
              color: "#94a3b8",
              weight: 1,
              opacity: 0.20,
              fill: false,
              dashArray: "4 7",
            }}
          />

          <Circle
            center={[-90, 0]}
            radius={3336000}
            pathOptions={{
              color: "#94a3b8",
              weight: 1,
              opacity: 0.16,
              fill: false,
              dashArray: "4 7",
            }}
          />

          {/* =================================================
              SUBTLE MERIDIAN GUIDES
          ================================================= */}

          <Polyline
            positions={[
              [-60, 0],
              [-90, 0],
            ]}
            pathOptions={{
              color: "#cbd5e1",
              weight: 1,
              opacity: 0.18,
              dashArray: "3 8",
            }}
          />

          <Polyline
            positions={[
              [-60, 90],
              [-90, 0],
            ]}
            pathOptions={{
              color: "#cbd5e1",
              weight: 1,
              opacity: 0.15,
              dashArray: "3 8",
            }}
          />

          <Polyline
            positions={[
              [-60, -90],
              [-90, 0],
            ]}
            pathOptions={{
              color: "#cbd5e1",
              weight: 1,
              opacity: 0.15,
              dashArray: "3 8",
            }}
          />

          <Polyline
            positions={[
              [-60, 180],
              [-90, 0],
            ]}
            pathOptions={{
              color: "#cbd5e1",
              weight: 1,
              opacity: 0.15,
              dashArray: "3 8",
            }}
          />

          {/* =================================================
              REAL SEA-ICE LAYER
          ================================================= */}

          <SeaIceLayer />

          {/* =================================================
              RESEARCH STATIONS LAYER
          ================================================= */}

          <ResearchStationsLayer />

          {/* =================================================
              VESSEL DETECTION RADIUS
          ================================================= */}

          <Circle
            center={vessel.position}
            radius={25000}
            pathOptions={{
              color: "#22d3ee",
              fillColor: "#22d3ee",
              fillOpacity: 0.04,
              weight: 1,
              opacity: 0.65,
              dashArray: "5 5",
            }}
          />

          {/* =================================================
              RESEARCH VESSEL
          ================================================= */}

          <Marker
            position={vessel.position}
            icon={vesselIcon}
          >
            <Tooltip
              permanent
              direction="bottom"
              offset={[0, 22]}
              className="vessel-tooltip"
            >
              🚢 {vessel.name}
            </Tooltip>

            <Popup>
              <div style={{ minWidth: "200px" }}>
                <strong>{vessel.name}</strong>

                <hr />

                <p>
                  <b>Status:</b> {vessel.status}
                </p>

                <p>
                  <b>Speed:</b> {vessel.speed}
                </p>

                <p>
                  <b>Heading:</b> {vessel.heading}
                </p>

                <p>
                  <b>Position:</b>
                  <br />
                  {vessel.position[0].toFixed(4)}°,{" "}
                  {vessel.position[1].toFixed(4)}°
                </p>
              </div>
            </Popup>
          </Marker>

          {/* =================================================
              RESEARCH STATIONS

              Every station has:
              - visible dot
              - permanent name
              - clickable information popup
          ================================================= */}

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

              <Popup>
                <div style={{ minWidth: "200px" }}>
                  <strong>{location.name}</strong>

                  <hr />

                  <p>
                    <b>Country / Program:</b>
                    <br />
                    {location.country}
                  </p>

                  <p>
                    <b>Facility:</b>
                    <br />
                    Antarctic Research Station
                  </p>

                  <p>
                    <b>Coordinates:</b>
                    <br />
                    {location.position[0].toFixed(4)}°,{" "}
                    {location.position[1].toFixed(4)}°
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* =================================================
              ICEBERGS
          ================================================= */}

          {icebergs.map((iceberg) => (
            <Marker
              key={iceberg.id}
              position={iceberg.position}
              icon={icebergIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -15]}
                className="antarctic-tooltip"
              >
                <div>
                  <strong>{iceberg.name}</strong>

                  <br />

                  Area: {iceberg.area} km²

                  <br />

                  Status: {iceberg.status}
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* =================================================
              ACTIVE ICEBERG TRAJECTORY POLYLINES & DRIFT FORECAST
          ================================================= */}
          {showTrajectory && activeTrajectory && (
            <>
              {/* Historical Path (Dashed gray/slate line) */}
              {activeTrajectory.historicalPath && activeTrajectory.historicalPath.length > 0 && (
                <Polyline
                  positions={activeTrajectory.historicalPath.map((p) => [p.lat, p.lon])}
                  pathOptions={{
                    color: "#64748b",
                    weight: 2.5,
                    dashArray: "3, 6",
                    opacity: 0.85,
                  }}
                />
              )}

              {/* 7-Day Predicted Trajectory Line (Glowing dashed Cyan) */}
              {activeTrajectory.predictedPath && activeTrajectory.predictedPath.length > 0 && (
                <>
                  <Polyline
                    positions={[
                      activeTrajectory.currentPosition || [activeTrajectory.predictedPath[0].lat, activeTrajectory.predictedPath[0].lon],
                      ...activeTrajectory.predictedPath.map((p) => [p.lat, p.lon]),
                    ]}
                    pathOptions={{
                      color: "#06b6d4",
                      weight: 3.5,
                      dashArray: "6, 8",
                      opacity: 0.95,
                    }}
                  />

                  {/* Daily Forecast Milestone Markers */}
                  {activeTrajectory.predictedPath.map((pt, idx) => (
                    <Marker
                      key={`traj-pt-${idx}`}
                      position={[pt.lat, pt.lon]}
                      icon={L.divIcon({
                        className: "trajectory-milestone-marker",
                        html: `
                          <div style="
                            background: #0284c7;
                            color: #ffffff;
                            font-size: 10px;
                            font-weight: 700;
                            padding: 2px 5px;
                            border-radius: 4px;
                            border: 1px solid #38bdf8;
                            box-shadow: 0 0 8px rgba(6,182,212,0.8);
                            white-space: nowrap;
                          ">${pt.day || `+${idx + 1}d`}</div>
                        `,
                        iconSize: [32, 18],
                        iconAnchor: [16, 9],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -10]} className="antarctic-tooltip">
                        <div className="text-xs">
                          <strong>{activeTrajectory.icebergName || "Active Iceberg"} ({pt.day || `+${idx + 1}d`})</strong>
                          <br />
                          Forecast Date: {pt.date}
                          <br />
                          Position: {pt.lat.toFixed(2)}°, {pt.lon.toFixed(2)}°
                        </div>
                      </Tooltip>
                    </Marker>
                  ))}
                </>
              )}
            </>
          )}

          {/* =================================================
              SEA-ICE LEGEND
          ================================================= */}

          <SeaIceLegend />

        </MapContainer>

        {/* =================================================
            MAP TITLE

            Positioned to the RIGHT of Leaflet's
            zoom controls so it doesn't cover them.
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute left-20 top-4
            z-[1000]
            rounded-lg
            border border-slate-200
            bg-white/95
            px-3 py-2
            shadow-md
            backdrop-blur
          "
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            HIMYANTRA
          </div>

          <div className="text-sm font-semibold text-slate-700">
            Antarctic Operating Area
          </div>
        </div>

        {/* =================================================
            PROJECTION INFORMATION
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute bottom-4 left-4
            z-[1000]
            rounded-md
            border border-slate-200
            bg-white/95
            px-3 py-2
            text-[11px]
            text-slate-500
            shadow-md
            backdrop-blur
          "
        >
          <div className="font-medium text-slate-600">
            EPSG:3031
          </div>

          <div>
            Antarctic Polar Stereographic
          </div>
        </div>

      </div>
    </div>
  );
}