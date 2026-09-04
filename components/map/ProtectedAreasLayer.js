"use client";

import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";

const ASPA_STYLE = {
  color: "#f59e0b",
  weight: 1.5,
  opacity: 0.9,
  fillColor: "#f59e0b",
  fillOpacity: 0.12,
};

const ASPA_HOVER_STYLE = {
  weight: 2.5,
  opacity: 1,
  fillOpacity: 0.24,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatArea(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString()} km²` : "Not specified";
}

function onEachASPA(feature, layer) {
  const p = feature?.properties || {};
  const marine = Number(p.Marine) === 1 ? "Yes" : "No";

  layer.bindPopup(`
    <div style="min-width:240px;font-family:inherit">
      <div style="font-size:11px;font-weight:700;letter-spacing:.12em;color:#64748b;text-transform:uppercase">
        Antarctic Specially Protected Area
      </div>
      <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:4px">
        ASPA ${escapeHtml(p.ASPA_No)}
      </div>
      <div style="font-size:13px;font-weight:600;color:#334155;margin-top:4px">
        ${escapeHtml(p.NAME)}
      </div>
      <div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:12px;line-height:1.7;color:#475569">
        <div><strong>Proponent:</strong> ${escapeHtml(p.Propon || "Not specified")}</div>
        <div><strong>Area:</strong> ${formatArea(p.Area_km)}</div>
        <div><strong>Marine component:</strong> ${marine}</div>
        <div><strong>Designation:</strong> ${escapeHtml(p.DesigInstr || "Not specified")}</div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#64748b">
        Source: Antarctic Specially Protected Areas 2024 dataset
      </div>
    </div>
  `);

  layer.on({
    mouseover: (event) => {
      event.target.setStyle(ASPA_HOVER_STYLE);
      event.target.bringToFront();
    },
    mouseout: (event) => {
      event.target.setStyle(ASPA_STYLE);
    },
  });
}

export default function ProtectedAreasLayer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/aspas.geojson")
      .then((response) => {
        if (!response.ok) throw new Error(`ASPA data request failed: ${response.status}`);
        return response.json();
      })
      .then((geojson) => {
        if (!cancelled) setData(geojson);
      })
      .catch((err) => {
        console.error("Could not load Antarctic protected areas:", err);
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !data) return null;

  return (
    <>
      <GeoJSON
        data={data}
        style={() => ASPA_STYLE}
        onEachFeature={onEachASPA}
      />

      <div
        className="pointer-events-none absolute left-4 top-[82px] z-[900] rounded-md border border-amber-300/50 bg-slate-950/90 px-3 py-2 shadow-lg backdrop-blur"
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-400/30" />
          Protected Areas
        </div>
        <div className="mt-1 text-[10px] text-slate-300">
          2024 Antarctic ASPA boundaries
        </div>
      </div>
    </>
  );
}
