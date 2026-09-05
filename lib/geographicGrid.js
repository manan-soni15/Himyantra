// lib/geographicGrid.js
// Geographic UI Grid for UI panels only.
// This is decoupled from the EPSG:3031 computational grid.
import { getCellDataAtXY, getEnvironmentRevision, calculateSpatialRiskAtLatLon } from './spatialRiskGrid';
import { latLonToXY } from './coordinateUtils';
export const GEO_GRID_MIN_LAT = -90;
export const GEO_GRID_MAX_LAT = -58;
export const GEO_GRID_MIN_LON = -180;
export const GEO_GRID_MAX_LON = 180;

export const LAT_INTERVAL = 2; // 2 degrees per panel
export const LON_INTERVAL = 10; // 10 degrees per panel

export const GEO_ROWS = Math.ceil((GEO_GRID_MAX_LAT - GEO_GRID_MIN_LAT) / LAT_INTERVAL);
export const GEO_COLS = Math.ceil((GEO_GRID_MAX_LON - GEO_GRID_MIN_LON) / LON_INTERVAL);

/**
 * Normalizes longitude to [-180, 180)
 */
function normalizeLon(lon) {
  let l = lon;
  while (l < -180) l += 360;
  while (l >= 180) l -= 360;
  return l;
}

/**
 * Returns panel index info for a given lat/lon
 */
export function getGeoPanelForLatLon(lat, lon) {
  if (lat < GEO_GRID_MIN_LAT || lat >= GEO_GRID_MAX_LAT) return null;
  const normLon = normalizeLon(lon);
  
  const latIndex = Math.floor((lat - GEO_GRID_MIN_LAT) / LAT_INTERVAL);
  const lonIndex = Math.floor((normLon - GEO_GRID_MIN_LON) / LON_INTERVAL);
  
  return { latIndex, lonIndex, panelId: `${latIndex}_${lonIndex}` };
}

/**
 * Returns bounds for a given panel ID
 */
export function getGeoPanelBounds(panelId) {
  if (!panelId) return null;
  const parts = panelId.split('_');
  if (parts.length !== 2) return null;
  
  const latIndex = parseInt(parts[0], 10);
  const lonIndex = parseInt(parts[1], 10);
  
  const latMin = GEO_GRID_MIN_LAT + (latIndex * LAT_INTERVAL);
  const latMax = latMin + LAT_INTERVAL;
  const lonMin = GEO_GRID_MIN_LON + (lonIndex * LON_INTERVAL);
  const lonMax = lonMin + LON_INTERVAL;
  
  const centerLat = (latMin + latMax) / 2;
  const centerLon = (lonMin + lonMax) / 2;
  
  return {
    panelId,
    latIndex,
    lonIndex,
    latMin,
    latMax,
    lonMin,
    lonMax,
    centerLat,
    centerLon
  };
}

const panelCache = new Map();

/**
 * Deterministically samples the panel to create a rich summary without precomputing the whole grid.
 * Caches based on environmentRevision.
 */
export async function getGeoPanelSummary(panelId) {
  const bounds = getGeoPanelBounds(panelId);
  if (!bounds) return null;

  const envRev = getEnvironmentRevision();
  const cacheKey = `${panelId}_${envRev}`;
  
  if (panelCache.has(cacheKey)) {
    return panelCache.get(cacheKey);
  }

  // Sample points: Center + 4 offset corners (25% in from edges)
  const latOffset = LAT_INTERVAL * 0.25;
  const lonOffset = LON_INTERVAL * 0.25;
  
  const sampleCoords = [
    { lat: bounds.centerLat, lon: bounds.centerLon }, // Center
    { lat: bounds.latMin + latOffset, lon: bounds.lonMin + lonOffset }, // BL
    { lat: bounds.latMin + latOffset, lon: bounds.lonMax - lonOffset }, // BR
    { lat: bounds.latMax - latOffset, lon: bounds.lonMin + lonOffset }, // TL
    { lat: bounds.latMax - latOffset, lon: bounds.lonMax - lonOffset }  // TR
  ];

  let totalRisk = 0;
  let maxRisk = -Infinity;
  let minRisk = Infinity;
  let landSamples = 0;
  let waterSamples = 0;
  let totalCompleteness = 0;
  let nearestIcebergName = null;
  let minIcebergDist = Infinity;
  let icebergSpeed = null;
  let icebergHeading = null;
  
  let sumSeaIce = 0;
  let sumWeather = 0;
  
  let validSamples = 0;

  for (const coord of sampleCoords) {
    if (coord.lat < GEO_GRID_MIN_LAT || coord.lat >= GEO_GRID_MAX_LAT) continue;

    // Use synchronous sample computation
    const cell = calculateSpatialRiskAtLatLon(coord.lat, coord.lon);
    if (!cell) continue;

    validSamples++;
    
    if (cell.isLand) {
      landSamples++;
    } else {
      waterSamples++;
    }

    if (cell.effectiveRoutingRisk !== null) {
      totalRisk += cell.effectiveRoutingRisk;
      if (cell.effectiveRoutingRisk > maxRisk) maxRisk = cell.effectiveRoutingRisk;
      if (cell.effectiveRoutingRisk < minRisk) minRisk = cell.effectiveRoutingRisk;
    }
    
    totalCompleteness += cell.riskDataCompleteness;
    
    // Iceberg metadata
    if (cell.metadata.nearestIcebergName && cell.metadata.nearestIcebergDistanceKm !== null) {
      if (cell.metadata.nearestIcebergDistanceKm < minIcebergDist) {
        minIcebergDist = cell.metadata.nearestIcebergDistanceKm;
        nearestIcebergName = cell.metadata.nearestIcebergName;
        // In a real scenario, we would lookup iceberg details here, but we will mock it based on metadata
      }
    }
    
    if (cell.metadata.seaIceConcentration !== null) sumSeaIce += cell.metadata.seaIceConcentration;
    if (cell.metadata.weatherSeverity !== null) sumWeather += cell.metadata.weatherSeverity;
  }

  const summary = {
    panelId,
    bounds,
    representativeRisk: validSamples > 0 && waterSamples > 0 ? Math.round(totalRisk / waterSamples) : null,
    minRisk: minRisk === Infinity ? null : minRisk,
    maxRisk: maxRisk === -Infinity ? null : maxRisk,
    landWaterSummary: landSamples === validSamples ? 'All Land' : (waterSamples === validSamples ? 'All Water' : 'Mixed Coastal'),
    completeness: validSamples > 0 ? (totalCompleteness / validSamples) : 0,
    nearestIceberg: nearestIcebergName,
    icebergDistanceKm: minIcebergDist === Infinity ? null : Math.round(minIcebergDist),
    seaIceValue: validSamples > 0 ? Math.round(sumSeaIce / validSamples) : 0,
    weatherValues: validSamples > 0 ? Math.round(sumWeather / validSamples) : 0,
    dataLineage: `Revision ${envRev}`
  };

  panelCache.set(cacheKey, summary);
  return summary;
}
