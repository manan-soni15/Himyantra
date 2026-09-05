"use client";
import SeaIceLayer from "./SeaIceLayer";
import SeaIceLegend from "./SeaIceLegend";
import GeographicInformationLayer from "./GeographicInformationLayer";
import RouteLayer from "./RouteLayer";
import GraticuleLayer from "./GraticuleLayer";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "proj4leaflet";
import { Maximize2, Minimize2, Grid } from "lucide-react";
import { icebergs } from "../../data/icebergs";
import { researchStations } from "../../data/researchStations";
import { useVessel } from "../../context/VesselContext";

// Antarctic Polar Stereographic Projection
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

// Custom abstract geometric iceberg marker
const icebergIcon = L.divIcon({
  className: "iceberg-marker",
  html: `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 0 4px rgba(226, 232, 240, 0.5));
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 16H20L12 2Z" fill="#94a3b8" stroke="#f8fafc" stroke-width="1.5"/>
        <path d="M4 16L12 22L20 16" fill="#64748b" stroke="#f8fafc" stroke-width="1.5"/>
      </svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 16],
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

export default function AntarcticMap({ routes = [], startMarker = null, endMarker = null }) {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRiskGrid, setShowRiskGrid] = useState(routes.length > 0);
  const { activeVessel } = useVessel();

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
  }, [startMarker?.source]); // Only pan when the source explicitly changes

  useEffect(() => {
    if (mapRef.current && endMarker) {
      mapRef.current.setView([endMarker.lat, endMarker.lon], mapRef.current.getZoom());
    }
  }, [endMarker?.source]); // Only pan when the source explicitly changes

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  // Fix for React 18 Strict Mode "Map container is already initialized" error during Fast Refresh
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
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 bg-slate-950/90 text-cyan-300 shadow-lg backdrop-blur transition hover:bg-slate-800"
            title={isFullscreen ? "Exit fullscreen" : "Maximize map"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <button
            onClick={() => setShowRiskGrid(!showRiskGrid)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg backdrop-blur transition ${
              showRiskGrid 
                ? "border-cyan-500 bg-cyan-950/90 text-cyan-400 hover:bg-cyan-900/90" 
                : "border-slate-600 bg-slate-950/90 text-slate-400 hover:bg-slate-800"
            }`}
            title="Toggle Spatial Risk Grid"
          >
            <Grid size={18} />
          </button>
        </div>

        <MapContainer
          center={[-64.77, -64.08]} // Centered on Palmer Station/Drake Passage area
          zoom={3}
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
          
          {/* Graticule Layer */}
          <GraticuleLayer visible={true} />

          <SeaIceLayer />
          
          {/* Geographic Information Layer */}
          <GeographicInformationLayer visible={showRiskGrid} />

          {/* Research Stations (Reference Data) */}
          {researchStations.map((station) => (
            <Marker key={station.id} position={[station.lat, station.lon]} icon={locationIcon}>
              <Tooltip permanent direction="top" offset={[0, -8]} className="antarctic-tooltip">
                {station.name}
              </Tooltip>
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong>{station.name}</strong>
                  <hr />
                  <p className="text-xs italic">Research Station Reference Data</p>
                  <p><b>Country:</b> {station.country}</p>
                  <p><b>Status:</b> {station.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Iceberg Markers */}
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

          {/* Evaluated Routes */}
          <RouteLayer routes={routes} />

          {/* Start and Destination Markers */}
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
              fillOpacity: 0.05,
              weight: 1,
            }}
          />

          {/* Research Vessel */}
          <Marker position={vessel.position} icon={vesselIcon}>
            <Tooltip permanent direction="bottom" offset={[0, 22]}>
              🚢 {vessel.name}
            </Tooltip>
            <Popup>
              <div style={{ minWidth: "180px" }}>
                <strong>{vessel.name}</strong>
                <hr />
                <p><b>Status:</b> {vessel.status}</p>
                <p><b>Speed:</b> {vessel.speed}</p>
                <p><b>Heading:</b> {vessel.heading}</p>
                <p>
                  <b>Position:</b><br />
                  {vessel.position[0].toFixed(2)}°, {vessel.position[1].toFixed(2)}°
                </p>
              </div>
            </Popup>
          </Marker>

          <SeaIceLegend />
        </MapContainer>

        {/* Projection Information */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-slate-400 backdrop-blur">
          EPSG:3031 • Antarctic Polar Projection
        </div>
      </div>
    </div>
  );
}