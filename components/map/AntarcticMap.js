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

function getRiskColor(level = 'safe') {
  const normalized = String(level).toLowerCase();
  if (normalized === 'critical') return '#ef4444';
  if (normalized === 'high') return '#f97316';
  if (normalized === 'moderate') return '#f59e0b';
  return '#22c55e';
}

function createVesselIcon(riskLevel = 'safe') {
  const color = getRiskColor(riskLevel);

  return L.divIcon({
    className: 'vessel-marker',
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${color}20;
          border: 2px solid ${color};
          box-shadow: 0 0 12px ${color}99;
        "></div>
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${color}35;
          border: 1px solid ${color}99;
        "></div>
        <div style="
          position: relative;
          font-size: 18px;
          filter: drop-shadow(0 0 6px ${color});
        ">
          🚢
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

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

function normalizeCoordinatePair(value, fallback = null) {
  if (!Array.isArray(value) || value.length !== 2) return fallback;

  const lat = Number(value[0]);
  const lon = Number(value[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return fallback;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return fallback;

  return [lat, lon];
}

function MapViewController({ center }) {
  const map = useMap();
  const prevCenterRef = useRef(null);

  useEffect(() => {
    const safeCenter = normalizeCoordinatePair(center);
    if (!safeCenter) return;

    const [lat, lon] = safeCenter;

    if (
      prevCenterRef.current &&
      prevCenterRef.current[0] === lat &&
      prevCenterRef.current[1] === lon
    ) {
      return;
    }

    prevCenterRef.current = safeCenter;
    map.flyTo(safeCenter, Math.max(3, map.getZoom()), {
      animate: true,
      duration: 1.2,
    });
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
  activeVesselRisk = null,
  showTrajectory = false,
}) {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRiskGrid, setShowRiskGrid] = useState(routes.length > 0);
  const { activeVessel } = useVessel();

  // Compute map center target safely: trajectory -> vessel -> Antarctic fallback
  const firstValidTrajectoryPoint =
    showTrajectory && Array.isArray(activeTrajectory?.predictedPath)
      ? activeTrajectory.predictedPath.find((point) =>
          normalizeCoordinatePair([point?.lat, point?.lon])
        )
      : null;

  const trajectoryCenter = firstValidTrajectoryPoint
    ? normalizeCoordinatePair([firstValidTrajectoryPoint.lat, firstValidTrajectoryPoint.lon])
    : null;

  const vesselPosition = normalizeCoordinatePair(activeVessel?.currentPosition);
  const activeCenter = trajectoryCenter || vesselPosition || [-64.77, -64.08];

  const safeStartCenter = startMarker
    ? normalizeCoordinatePair([startMarker.lat, startMarker.lon])
    : null;
  const safeEndCenter = endMarker
    ? normalizeCoordinatePair([endMarker.lat, endMarker.lon])
    : null;

  const trajectoryCurrentPosition = normalizeCoordinatePair(activeTrajectory?.currentPosition);
  const predictedPositions = Array.isArray(activeTrajectory?.predictedPath)
    ? activeTrajectory.predictedPath
        .map((point) => normalizeCoordinatePair([point?.lat, point?.lon]))
        .filter(Boolean)
    : [];

  const vessel = {
    name: activeVessel?.name || 'Research Vessel',
    position: vesselPosition || [-64.77, -64.08],
    heading: "South-East",
    speed: `${activeVessel?.maxSpeedKnots ?? 0} knots`,
    status: activeVessel?.status || "Navigating",
  };

  useEffect(() => {
    if (mapRef.current && safeStartCenter) {
      mapRef.current.setView(safeStartCenter, mapRef.current.getZoom());
    }
  }, [safeStartCenter?.[0], safeStartCenter?.[1], startMarker?.source]);

  useEffect(() => {
    if (mapRef.current && safeEndCenter) {
      mapRef.current.setView(safeEndCenter, mapRef.current.getZoom());
    }
  }, [safeEndCenter?.[0], safeEndCenter?.[1], endMarker?.source]);

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
                      ...(trajectoryCurrentPosition
                        ? [trajectoryCurrentPosition]
                        : predictedPositions.slice(0, 1)),
                      ...predictedPositions,
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
          {safeStartCenter && (
            <Marker position={safeStartCenter} icon={startIcon}>
              <Tooltip permanent direction="top" offset={[0, -16]} className="antarctic-tooltip font-bold text-green-400">
                START
              </Tooltip>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong className="text-green-500">Origin / Start</strong>
                  <hr />
                  <p><b>Source:</b> {startMarker.source}</p>
                  <p><b>Lat:</b> {safeStartCenter[0].toFixed(4)}°</p>
                  <p><b>Lon:</b> {safeStartCenter[1].toFixed(4)}°</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination / End Marker */}
          {safeEndCenter && (
            <Marker position={safeEndCenter} icon={destIcon}>
              <Tooltip permanent direction="top" offset={[0, -16]} className="antarctic-tooltip font-bold text-red-400">
                DESTINATION
              </Tooltip>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong className="text-red-500">Destination / End</strong>
                  <hr />
                  <p><b>Source:</b> {endMarker.source}</p>
                  <p><b>Lat:</b> {safeEndCenter[0].toFixed(4)}°</p>
                  <p><b>Lon:</b> {safeEndCenter[1].toFixed(4)}°</p>
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
          <Marker key={`active-vessel-${activeVessel?.id || 'unknown'}-${activeVesselRisk?.level || 'unknown'}`} position={vessel.position} icon={createVesselIcon(activeVesselRisk?.level)}>
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
                {activeVesselRisk && (
                  <>
                    <p><b>Position Risk:</b> <span style={{ color: getRiskColor(activeVesselRisk.level), fontWeight: 700 }}>{activeVesselRisk.level.toUpperCase()} — {activeVesselRisk.score}/100</span></p>
                    {Number.isFinite(activeVesselRisk.breakdown?.seaIceConcentration) && (
                      <p><b>AMSR2 Ice:</b> {activeVesselRisk.breakdown.seaIceConcentration}%</p>
                    )}
                  </>
                )}
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