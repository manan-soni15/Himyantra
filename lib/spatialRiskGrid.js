// lib/spatialRiskGrid.js
// Final Phase 3.1: Dynamic Spatial Risk Grid Generation and Environmental Sampling

import { latLonToXY, xyToLatLon } from './coordinateUtils';
import { seaIceGrid } from '../data/seaIce';
import mockIcebergs from '../data/mockIcebergs';
import { normalizeIceberg } from './dataNormalizer';
import { currentWeather } from '../data/weather';
import { isCellLand } from './landMask';
import { 
  GRID_MIN_X, GRID_MAX_X, GRID_MIN_Y, GRID_MAX_Y, GRID_CELL_SIZE_M, 
  cellIndex 
} from './gridUtils';
import { calculateEffectiveRoutingRisk } from './traversability';

// Re-export for backwards compatibility if needed
export { GRID_MIN_X, GRID_MAX_X, GRID_MIN_Y, GRID_MAX_Y, GRID_CELL_SIZE_M };

let cachedGrid = null;
let projectedIcebergsCache = null;
let currentEnvironmentRevision = 1;

export function getEnvironmentRevision() {
  return currentEnvironmentRevision;
}

export function invalidateEnvironmentCache() {
  cachedGrid = null;
  projectedIcebergsCache = null;
  currentEnvironmentRevision++;
}

export function distanceMeters(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function getRiskLevel(score) {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

function getProjectedIcebergs() {
  if (projectedIcebergsCache) return projectedIcebergsCache;
  if (!mockIcebergs) return [];

  const normalizedIcebergs = mockIcebergs.map(normalizeIceberg).filter(i => i !== null);

  projectedIcebergsCache = normalizedIcebergs.map(iceberg => {
    const pos = iceberg.position ? latLonToXY(iceberg.position[0], iceberg.position[1]) : null;
    const history = (iceberg.history || []).map(pt => latLonToXY(pt.lat, pt.lon)).filter(Boolean);
    return {
      ...iceberg,
      projectedPos: pos,
      projectedHistory: history
    };
  }).filter(i => i.projectedPos !== null);

  return projectedIcebergsCache;
}

export function sampleSeaIceEnv(x, y) {
  if (!seaIceGrid || seaIceGrid.length === 0) return null;
  
  let minDist = Infinity;
  let nearestConcentration = 0;

  for (const cell of seaIceGrid) {
    if (cell.lat === null || cell.lon === null) continue;
    const projected = latLonToXY(cell.lat, cell.lon);
    if (!projected) continue;
    
    const dist = distanceMeters(x, y, projected.x, projected.y);
    if (dist < minDist) {
      minDist = dist;
      nearestConcentration = cell.concentration;
    }
  }

  // Define radius where data is considered "available". For sea ice (25km res), within 50km is reasonable.
  if (minDist > 100000) return null; // Too far from any sea ice data point

  return {
    seaIceConcentration: nearestConcentration,
    seaIceRisk: Math.min(100, Math.max(0, nearestConcentration))
  };
}

export function sampleWeatherEnv(x, y) {
  if (!currentWeather) return null;
  const severityIndex = typeof currentWeather.severityIndex === 'number' ? currentWeather.severityIndex : 0;
  return {
    windSpeed: currentWeather.windSpeedKnots || 0,
    temperature: currentWeather.airTempCelsius || 0,
    pressure: currentWeather.mslPressureHpa || 0,
    visibility: currentWeather.visibilityNauticalMiles || 0,
    waveHeight: currentWeather.waveHeightMeters || 0,
    weatherRisk: Math.min(100, Math.max(0, severityIndex))
  };
}

export function sampleIcebergEnv(x, y) {
  const projectedIcebergs = getProjectedIcebergs();
  if (projectedIcebergs.length === 0) return null; // We might want to treat "0 icebergs" as valid 0 risk, not missing data.
  // Wait, if the iceberg array is loaded, then iceberg data is available.
  
  let totalRisk = 0;
  let totalTrajectoryInfluence = 0;
  let nearestDistM = Infinity;
  let nearestIcebergName = null;
  let relevantIcebergCount = 0;
  let maxIcebergRiskContribution = 0;

  for (const iceberg of projectedIcebergs) {
    const distM = distanceMeters(x, y, iceberg.projectedPos.x, iceberg.projectedPos.y);
    
    if (distM < nearestDistM) {
      nearestDistM = distM;
      nearestIcebergName = iceberg.name || iceberg.id || 'Unknown Iceberg';
    }

    let icebergContribution = 0;
    const distanceKm = distM / 1000;

    if (distanceKm <= 100) {
      relevantIcebergCount++;
      const distanceRisk = Math.max(0, 1 - (distanceKm / 100)) * 100;
      const areaKm2 = typeof iceberg.area === 'number' && iceberg.area > 0 ? iceberg.area : 1;
      const areaMultiplier = Math.max(1.0, Math.min(2.0, 1 + (Math.log10(Math.max(areaKm2, 1)) / 10)));
      icebergContribution = distanceRisk * areaMultiplier;
    }

    let trajectoryContribution = 0;
    if (iceberg.projectedHistory && iceberg.projectedHistory.length > 0) {
      for (const histPos of iceberg.projectedHistory) {
        const histDistM = distanceMeters(x, y, histPos.x, histPos.y);
        const histDistKm = histDistM / 1000;
        
        if (histDistKm <= 100) {
          const trajDistanceRisk = Math.max(0, 1 - (histDistKm / 100)) * 100;
          const areaKm2 = typeof iceberg.area === 'number' && iceberg.area > 0 ? iceberg.area : 1;
          const areaMultiplier = Math.max(1.0, Math.min(2.0, 1 + (Math.log10(Math.max(areaKm2, 1)) / 10)));
          trajectoryContribution += trajDistanceRisk * areaMultiplier * 0.50;
        }
      }
    }
    
    if (trajectoryContribution > 0 && icebergContribution === 0) {
      relevantIcebergCount++;
    }

    const currentIcebergTotal = icebergContribution + trajectoryContribution;
    if (currentIcebergTotal > maxIcebergRiskContribution) {
        maxIcebergRiskContribution = currentIcebergTotal;
    }
    totalRisk += currentIcebergTotal;
  }

  return {
    nearestIcebergName,
    nearestIcebergDistanceKm: nearestDistM === Infinity ? null : nearestDistM / 1000,
    relevantIcebergCount,
    trajectoryInfluence: Math.round(totalTrajectoryInfluence),
    icebergRisk: Math.min(100, Math.max(0, totalRisk)),
    nearestIcebergContribution: Math.round(maxIcebergRiskContribution)
  };
}

export function calculateSpatialRiskAtXY(x, y, centerLat, centerLon, colIndex = -1, rowIndex = -1) {
  const icebergEnv = mockIcebergs && mockIcebergs.length > 0 ? sampleIcebergEnv(x, y) : null; 
  const seaIceEnv = sampleSeaIceEnv(x, y);
  const weatherEnv = sampleWeatherEnv(x, y);

  let totalWeight = 0;
  let combinedScore = 0;
  let dataComponentsCount = 0;

  if (icebergEnv !== null) {
    totalWeight += 0.35;
    combinedScore += icebergEnv.icebergRisk * 0.35;
    dataComponentsCount++;
  }
  
  if (seaIceEnv !== null) {
    totalWeight += 0.35;
    combinedScore += seaIceEnv.seaIceRisk * 0.35;
    dataComponentsCount++;
  }

  if (weatherEnv !== null) {
    totalWeight += 0.30;
    combinedScore += weatherEnv.weatherRisk * 0.30;
    dataComponentsCount++;
  }

  let finalRisk = 0;
  if (totalWeight > 0) {
    finalRisk = combinedScore / totalWeight; // Renormalize based on available weights
  }

  const riskDataCompleteness = dataComponentsCount / 3;
  const envRisk = Math.round(Math.min(100, Math.max(0, finalRisk)));

  const minX = x - GRID_CELL_SIZE_M / 2;
  const maxX = x + GRID_CELL_SIZE_M / 2;
  const minY = y - GRID_CELL_SIZE_M / 2;
  const maxY = y + GRID_CELL_SIZE_M / 2;

  // Land Mask calculation
  const isLand = isCellLand(minX, maxX, minY, maxY);
  
  // Base navigability based on land footprint
  const isNavigable = !isLand;

  const cell = {
    index: colIndex !== -1 && rowIndex !== -1 ? cellIndex(rowIndex, colIndex) : null,
    row: rowIndex !== -1 ? rowIndex : null,
    col: colIndex !== -1 ? colIndex : null,
    x,
    y,
    lat: centerLat !== undefined ? centerLat : null,
    lon: centerLon !== undefined ? centerLon : null,
    
    isLand,
    isNavigable,
    
    // Core Risk metrics
    environmentalRisk: envRisk,
    riskDataCompleteness,
    
    // Components
    icebergRisk: icebergEnv ? icebergEnv.icebergRisk : null,
    seaIceRisk: seaIceEnv ? seaIceEnv.seaIceRisk : null,
    weatherRisk: weatherEnv ? weatherEnv.weatherRisk : null,
    
    // Metadata block
    metadata: {
      nearestIcebergName: icebergEnv ? icebergEnv.nearestIcebergName : null,
      nearestIcebergDistanceKm: icebergEnv ? icebergEnv.nearestIcebergDistanceKm : null,
      nearestIcebergContribution: icebergEnv ? icebergEnv.nearestIcebergContribution : null,
      seaIceConcentration: seaIceEnv ? seaIceEnv.seaIceConcentration : null,
      weatherSeverity: weatherEnv ? weatherEnv.weatherRisk : null,
      weatherWind: weatherEnv ? weatherEnv.windSpeed : null,
      weatherTemperature: weatherEnv ? weatherEnv.temperature : null,
      weatherPressure: weatherEnv ? weatherEnv.pressure : null,
      riskDataCompleteness,
      isLand,
      isNavigable
    }
  };

  // Add the effectiveRoutingRisk now that we have the object
  cell.effectiveRoutingRisk = calculateEffectiveRoutingRisk(cell);
  
  return cell;
}

export function calculateSpatialRiskAtLatLon(lat, lon) {
  const projected = latLonToXY(lat, lon);
  if (!projected) return null;
  return calculateSpatialRiskAtXY(projected.x, projected.y, lat, lon);
}

export function getCellDataAtXY(x, y) {
  if (x < GRID_MIN_X || x > GRID_MAX_X || y < GRID_MIN_Y || y > GRID_MAX_Y) {
    return null; 
  }
  
  if (cachedGrid) {
    const colIndex = Math.floor((x - GRID_MIN_X) / GRID_CELL_SIZE_M);
    const rowIndex = Math.floor((y - GRID_MIN_Y) / GRID_CELL_SIZE_M);
    const numRows = Math.floor((GRID_MAX_Y - GRID_MIN_Y) / GRID_CELL_SIZE_M);
    
    const index = colIndex * numRows + rowIndex;
    if (index >= 0 && index < cachedGrid.length) {
      return cachedGrid[index];
    }
  }

  return calculateSpatialRiskAtXY(x, y);
}

export function getSpatialRiskGrid() {
  if (cachedGrid) return cachedGrid;

  getProjectedIcebergs();

  const grid = [];
  let colIndex = 0;
  
  for (let x = GRID_MIN_X; x < GRID_MAX_X; x += GRID_CELL_SIZE_M) {
    let rowIndex = 0;
    for (let y = GRID_MIN_Y; y < GRID_MAX_Y; y += GRID_CELL_SIZE_M) {
      const centerX = x + GRID_CELL_SIZE_M / 2;
      const centerY = y + GRID_CELL_SIZE_M / 2;
      const centerLatLon = xyToLatLon(centerX, centerY);
      
      const cellData = calculateSpatialRiskAtXY(
        centerX, 
        centerY, 
        centerLatLon ? centerLatLon.lat : null, 
        centerLatLon ? centerLatLon.lon : null,
        colIndex,
        rowIndex
      );

      grid.push(cellData);
      rowIndex++;
    }
    colIndex++;
  }

  cachedGrid = grid;
  return cachedGrid;
}
