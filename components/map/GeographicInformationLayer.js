import { useState } from 'react';
import { Polygon, Tooltip, useMapEvents } from 'react-leaflet';
import { getGeoPanelBounds, GEO_ROWS, GEO_COLS, GEO_GRID_MIN_LAT, GEO_GRID_MIN_LON, LAT_INTERVAL, LON_INTERVAL, getGeoPanelSummary } from '../../lib/geographicGrid';

export default function GeographicInformationLayer({ visible }) {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [panelData, setPanelData] = useState(null);

  // We use map events to capture clicks and resolve the Geographic UI Panel
  useMapEvents({
    click(e) {
      if (!visible) return;
      
      const { lat, lng: lon } = e.latlng;
      let normLon = lon;
      while (normLon < -180) normLon += 360;
      while (normLon >= 180) normLon -= 360;

      if (lat < GEO_GRID_MIN_LAT || lat >= -58) return;

      const latIndex = Math.floor((lat - GEO_GRID_MIN_LAT) / LAT_INTERVAL);
      const lonIndex = Math.floor((normLon - GEO_GRID_MIN_LON) / LON_INTERVAL);
      
      const panelId = `${latIndex}_${lonIndex}`;
      const bounds = getGeoPanelBounds(panelId);
      
      if (!bounds) return;

      setSelectedPanel(bounds);
      setLoading(true);

      // Async loading of environmental risk to prevent UI freezing
      getGeoPanelSummary(panelId).then(summary => {
        setPanelData({
          summary,
          clickedLat: lat,
          clickedLon: normLon
        });
        setLoading(false);
      });
    }
  });

  if (!visible) return null;

  const panels = [];
  // Render lightweight transparent boxes over the grid to indicate interactivity
  for (let r = 0; r < GEO_ROWS; r++) {
    for (let c = 0; c < GEO_COLS; c++) {
      const panelId = `${r}_${c}`;
      const bounds = getGeoPanelBounds(panelId);
      if (!bounds) continue;
      
      // We only render an active border if it's selected, otherwise it's just a passive hit area
      // Actually we don't need to render 576 hit areas, Leaflet map handles the click event directly via useMapEvents!
      // We only render the selected panel's bounding box.
    }
  }

  return (
    <>
      {selectedPanel && (
        <Polygon
          positions={[
            [selectedPanel.latMin, selectedPanel.lonMin],
            [selectedPanel.latMax, selectedPanel.lonMin],
            [selectedPanel.latMax, selectedPanel.lonMax],
            [selectedPanel.latMin, selectedPanel.lonMax],
          ]}
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            fillColor: '#0ea5e9',
            fillOpacity: 0.1
          }}
        >
          <Tooltip permanent direction="center" className="bg-slate-900 text-slate-200 border border-slate-700 p-3 rounded shadow-xl min-w-[250px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mb-2"></div>
                <span className="text-sm">Loading environmental information...</span>
              </div>
            ) : panelData ? (
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm text-cyan-400 mb-2">Geographic Panel {selectedPanel.panelId}</div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <div><span className="text-slate-400">Lat:</span> {selectedPanel.latMin}° to {selectedPanel.latMax}°</div>
                  <div><span className="text-slate-400">Lon:</span> {selectedPanel.lonMin}° to {selectedPanel.lonMax}°</div>
                </div>
                
                <hr className="border-slate-700 my-1"/>
                
                <div>
                  <span className="text-slate-400">Reference:</span> {panelData.clickedLat.toFixed(2)}°, {panelData.clickedLon.toFixed(2)}°
                </div>
                <div>
                  <span className="text-slate-400">Terrain:</span> {panelData.summary ? panelData.summary.landWaterSummary : 'Outside Scope'}
                </div>
                
                {panelData.summary && panelData.summary.landWaterSummary !== 'All Land' && (
                  <>
                    <div className="mt-2">
                      <span className="text-slate-400">Representative Env Risk:</span> {panelData.summary.representativeRisk !== null ? `${panelData.summary.representativeRisk}/100` : 'Unknown'}
                    </div>
                    {panelData.summary.minRisk !== null && (
                      <div>
                        <span className="text-slate-400">Risk Range:</span> {Math.round(panelData.summary.minRisk)} - {Math.round(panelData.summary.maxRisk)}
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Data Completeness:</span> {(panelData.summary.completeness * 100).toFixed(0)}%
                    </div>
                    
                    <hr className="border-slate-700 my-1"/>
                    <div className="text-slate-400 font-semibold">Local Environment (Prototype Data)</div>
                    <div>
                      <span className="text-slate-400">Sea Ice:</span> {panelData.summary.seaIceValue > 0 ? `${panelData.summary.seaIceValue}%` : 'None'}
                    </div>
                    <div>
                      <span className="text-slate-400">Nearest Iceberg:</span> {panelData.summary.nearestIceberg ? `${panelData.summary.nearestIceberg} (${panelData.summary.icebergDistanceKm}km)` : 'None detected'}
                    </div>
                    <div>
                      <span className="text-slate-400">Weather Severity:</span> {panelData.summary.weatherValues}/100
                    </div>
                    <div className="text-[9px] text-slate-500 mt-2 text-right">
                      {panelData.summary.dataLineage}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </Tooltip>
        </Polygon>
      )}
    </>
  );
}
