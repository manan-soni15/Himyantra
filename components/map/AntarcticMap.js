"use client";

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
import { Maximize2, Minimize2, Grid } from "lucide-react";

import SeaIceLayer from "./SeaIceLayer";
import SeaIceLegend from "./SeaIceLegend";
import ProtectedAreasLayer from "./ProtectedAreasLayer";
import ResearchStationsLayer from "./ResearchStationsLayer";
import GeographicInformationLayer from "./GeographicInformationLayer";
import RouteLayer from "./RouteLayer";
import GraticuleLayer from "./GraticuleLayer";

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
      8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625,
    ],
  }
);

/* =========================================================
   Custom Marker Icons
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
        background: rgba(34,211,238,0.18);
        border: 1px solid rgba(34,211,238,0.5);
      "></div>
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(34,211,238,0.35);
      "></div>
      <div style="
        position: relative;
        font-size: 18px;
        filter: drop-shadow(0 0 6px rgba(34,211,238,0.9));
      ">
        🚢
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const icebergIcon = L.divIcon({
  className: "iceberg-marker",
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #f8fafc;
      border: 2px solid #38bdf8;
      transform: rotate(45deg);
      box-shadow: 0 0 10px rgba(56,189,248,0.9);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const startIcon = L.divIcon({
  className: "start-marker",
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(34, 197, 94, 0.2);
        border: 2px solid #22c55e;
      "></div>
      <div style="
        position: relative;
        font-weight: bold;
        font-size: 14px;
        color: #22c55e;
        filter: drop-shadow(0 0 2px rgba(0,0,0,1));
      ">
        A
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destIcon = L.divIcon({
  className: "dest-marker",
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.2);
        border: 2px solid #ef4444;
      "></div>
      <div style="
        position: relative;
        font-weight: bold;
        font-size: 14px;
        color: #ef4444;
        filter: drop-shadow(0 0 2px rgba(0,0,0,1));
      ">
        B
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* =========================================================
   Map View Controller for Dynamic Iceberg Auto-Centering
   (Memoized coordinates prevent infinite flyTo render loops)
========================================================= */

function MapViewController({ center }) {
  const map = useMap();
  const prevCenterRef = useRef(null);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      const [lat, lon] = center;
      if (!prevCenterRef.current || prevCenterRef.current[0] !== lat || prevCenterRef.current[1] !== lon) {
        prevCenterRef.current = [lat, lon];
        map.flyTo([lat, lon], Math.max(3, map.getZoom()), {
          animate: true,
          duration: 1.2,
        });
      }
    }
  }, [center, map]);

  return null;
}

/* =========================================================
   AntarcticMap Component
   (Combines Phase 3.1 Routing & Risk with Teammate Features)
========================================================= */

export default function AntarcticMap({
  routes = [],
  startMarker = null,
  endMarker = null,
  activeTrajectory = null,
  activeIcebergId = null,
  showTrajectory = false,
}) {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRiskGrid, setShowRiskGrid] = useState(routes.length > 0);
  const { activeVessel } = useVessel();

  // Compute map center target: active trajectory if requested, or vessel position, or fallback
  const activeCenter =
    showTrajectory &&
    Array.isArray(activeTrajectory?.predictedPath) &&
    activeTrajectory.predictedPath.length > 0
      ? [
          Number(activeTrajectory.predictedPath[0].lat),
          Number(activeTrajectory.predictedPath[0].lon),
        ]
      : activeVessel?.currentPosition || [-64.77, -64.08];

  const vessel = {
    name: activeVessel.name,
    position: activeVessel.currentPosition,
    heading: "South-East",
    speed: `${activeVessel.maxSpeedKnots} knots`,
    status: activeVessel.status || "Navigating",
  };

  useEffect(() => {
    if (mapRef.current && startMarker) {
      mapRef.current.setView([startMarker.lat, startMarker.lon], mapRef.current.getZoom());
    }
  }, [startMarker?.source]);

  useEffect(() => {
    if (mapRef.current && endMarker) {
      mapRef.current.setView([endMarker.lat, endMarker.lon], mapRef.current.getZoom());
    }
  }, [endMarker?.source]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  // Fix for React Strict Mode "Map container is already initialized" error during Fast Refresh
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const container = mapRef.current.getContainer();
        if (container) {
          container._leaflet_id = null;
        }
      }
    };
  }, []);

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
        {/* Map Controls */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-cyan-300 shadow-lg backdrop-blur transition hover:bg-slate-800"
            title={isFullscreen ? "Exit fullscreen" : "Maximize map"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={() => setShowRiskGrid(!showRiskGrid)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg backdrop-blur transition ${
              showRiskGrid
                ? "border-cyan-500 bg-cyan-950/90 text-cyan-400 hover:bg-cyan-900/90"
                : "border-slate-700 bg-slate-950/90 text-slate-400 hover:bg-slate-800"
            }`}
            title="Toggle Spatial Risk Grid"
          >
            <Grid size={18} />
          </button>
        </div>

        {/* Map Container */}
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

          {/* NASA Antarctic Basemap */}
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/{z}/{y}/{x}.jpeg"
            attribution="NASA GIBS"
            tileSize={512}
            noWrap={true}
            opacity={1}
          />

          {/* Polar Latitude Rings (80°S, 70°S, 60°S) */}
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

          {/* Meridian Guides */}
          <Polyline
            positions={[[-60, 0], [-90, 0]]}
            pathOptions={{ color: "#cbd5e1", weight: 1, opacity: 0.18, dashArray: "3 8" }}
          />
          <Polyline
            positions={[[-60, 90], [-90, 0]]}
            pathOptions={{ color: "#cbd5e1", weight: 1, opacity: 0.15, dashArray: "3 8" }}
          />
          <Polyline
            positions={[[-60, -90], [-90, 0]]}
            pathOptions={{ color: "#cbd5e1", weight: 1, opacity: 0.15, dashArray: "3 8" }}
          />
          <Polyline
            positions={[[-60, 180], [-90, 0]]}
            pathOptions={{ color: "#cbd5e1", weight: 1, opacity: 0.15, dashArray: "3 8" }}
          />

          {/* Graticule Layer */}
          <GraticuleLayer visible={true} />

          {/* Sea Ice Concentration Layer */}
          <SeaIceLayer />

          {/* Antarctic Specially Protected Areas (ASPA) */}
          <ProtectedAreasLayer />

          {/* Research Stations Layer */}
          <ResearchStationsLayer />

          {/* 25 km Geographic Information / Spatial Risk Grid */}
          <GeographicInformationLayer visible={showRiskGrid} />

          {/* Tracked Iceberg Markers */}
          {icebergs.map((iceberg) => (
            <Marker key={iceberg.id} position={iceberg.position} icon={icebergIcon}>
              <Tooltip direction="top" offset={[0, -15]} className="antarctic-tooltip">
                <div>
                  <strong>{iceberg.name}</strong><br />
                  Area: {iceberg.area ? `${iceberg.area} km²` : 'Unknown'}<br />
                  Position: {iceberg.position[0].toFixed(2)}°, {iceberg.position[1].toFixed(2)}°<br />
                  Status: {iceberg.status}
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* Active Iceberg Trajectory Polylines & Forecast Waypoints */}
          {showTrajectory && activeTrajectory && (
            <>
              {Array.isArray(activeTrajectory.historicalPath) && activeTrajectory.historicalPath.length >= 2 && (
                <Polyline
                  positions={activeTrajectory.historicalPath
                    .map((pt) => [Number(pt.lat), Number(pt.lon)])
                    .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]))}
                  pathOptions={{
                    color: "#94a3b8",
                    weight: 3,
                    dashArray: "6 8",
                    opacity: 0.95,
                  }}
                />
              )}

              {Array.isArray(activeTrajectory.predictedPath) && activeTrajectory.predictedPath.length > 0 && (
                <>
                  <Polyline
                    positions={[
                      ...(Array.isArray(activeTrajectory.currentPosition)
                        ? [[Number(activeTrajectory.currentPosition[0]), Number(activeTrajectory.currentPosition[1])]]
                        : [[Number(activeTrajectory.predictedPath[0].lat), Number(activeTrajectory.predictedPath[0].lon)]]),
                      ...activeTrajectory.predictedPath
                        .map((pt) => [Number(pt.lat), Number(pt.lon)])
                        .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1])),
                    ]}
                    pathOptions={{
                      color: "#22d3ee",
                      weight: 4,
                      dashArray: "8 8",
                      opacity: 1,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />

                  {activeTrajectory.predictedPath.map((point, index) => {
                    const lat = Number(point.lat);
                    const lon = Number(point.lon);
                    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

                    return (
                      <Marker
                        key={`trajectory-point-${activeTrajectory.icebergName || "iceberg"}-${index}`}
                        position={[lat, lon]}
                        icon={L.divIcon({
                          className: "trajectory-milestone-marker",
                          html: `
                            <div style="
                              background: #0284c7;
                              color: #ffffff;
                              font-size: 10px;
                              font-weight: 700;
                              padding: 3px 6px;
                              border-radius: 4px;
                              border: 1px solid #38bdf8;
                              box-shadow: 0 0 10px rgba(6,182,212,0.9);
                              white-space: nowrap;
                            ">
                              ${point.day ? `+${point.day}d` : `+${index + 1}d`}
                            </div>
                          `,
                          iconSize: [36, 20],
                          iconAnchor: [18, 10],
                        })}
                      >
                        <Tooltip direction="top" offset={[0, -10]} className="antarctic-tooltip">
                          <div className="text-xs">
                            <strong>{activeTrajectory.icebergName || "Active Iceberg"}</strong><br />
                            Forecast: +{point.day || index + 1} day<br />
                            Date: {point.date}<br />
                            Position: {lat.toFixed(2)}°, {lon.toFixed(2)}°
                          </div>
                        </Tooltip>
                      </Marker>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Phase 3.1 Evaluated A* Routes */}
          <RouteLayer routes={routes} />

          {/* Origin / Start Marker */}
          {startMarker && (
            <Marker position={[startMarker.lat, startMarker.lon]} icon={startIcon}>
              <Tooltip permanent direction="top" offset={[0, -16]} className="antarctic-tooltip font-bold text-green-400">
                START
              </Tooltip>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong className="text-green-500">Origin / Start</strong>
                  <hr />
                  <p><b>Source:</b> {startMarker.source}</p>
                  <p><b>Lat:</b> {startMarker.lat.toFixed(4)}°</p>
                  <p><b>Lon:</b> {startMarker.lon.toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination / End Marker */}
          {endMarker && (
            <Marker position={[endMarker.lat, endMarker.lon]} icon={destIcon}>
              <Tooltip permanent direction="top" offset={[0, -16]} className="antarctic-tooltip font-bold text-red-400">
                DESTINATION
              </Tooltip>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong className="text-red-500">Destination / End</strong>
                  <hr />
                  <p><b>Source:</b> {endMarker.source}</p>
                  <p><b>Lat:</b> {endMarker.lat.toFixed(4)}°</p>
                  <p><b>Lon:</b> {endMarker.lon.toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vessel Detection Radius */}
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

          {/* Active Research Vessel Marker */}
          <Marker position={vessel.position} icon={vesselIcon}>
            <Tooltip permanent direction="bottom" offset={[0, 22]} className="vessel-tooltip">
              🚢 {vessel.name}
            </Tooltip>
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <strong>{vessel.name}</strong>
                <hr />
                <p><b>Status:</b> {vessel.status}</p>
                <p><b>Speed:</b> {vessel.speed}</p>
                <p><b>Heading:</b> {vessel.heading}</p>
                <p>
                  <b>Position:</b><br />
                  {vessel.position[0].toFixed(4)}°, {vessel.position[1].toFixed(4)}°
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Sea-Ice Legend */}
          <SeaIceLegend />
        </MapContainer>

        {/* Map Badges */}
        <div className="pointer-events-none absolute left-20 top-4 z-[1000] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-md backdrop-blur">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
            HIMYANTRA
          </div>
          <div className="text-sm font-semibold text-white">
            Antarctic Operating Area
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-400 shadow-md backdrop-blur">
          <div className="font-medium text-cyan-300">
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