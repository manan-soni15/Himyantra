// lib/routeOptimizer.js
// Final Phase 3.1: Route Optimization and Objective Ranking Engine with Spatial Evaluation

import { getCellDataAtXY, getSpatialRiskGrid, getEnvironmentRevision } from './spatialRiskGrid';
import { latLonToXY, xyToLatLon } from './coordinateUtils';
import { isCellTraversable } from './traversability';
import { distanceMeters } from './gridUtils';

let astarWorker = null;
let currentRequestId = 0;
let routeCache = {};

/**
 * Resolves a coordinate (which might be on land) to the nearest safe maritime access point.
 * Uses BFS out to a maximum radius.
 * Returns { lat, lon, isResolved } or null if no access.
 */
export function resolveMaritimeAccessPoint(lat, lon) {
  const originXY = latLonToXY(lat, lon);
  if (!originXY) return null;

  const gridCellSize = 25000;
  // First, check if exact point is traversable
  let cellData = getCellDataAtXY(originXY.x, originXY.y);
  if (isCellTraversable(cellData)) {
    return { lat, lon, isResolved: false };
  }

  // If not, BFS outwards up to max distance
  const maxSearchDistKm = 100;
  const maxSearchCells = Math.ceil((maxSearchDistKm * 1000) / gridCellSize);

  // We are searching in projected space
  let closestValidPoint = null;
  let minProjDist = Infinity;

  // Check a square boundary up to maxSearchCells around the point
  for (let dx = -maxSearchCells; dx <= maxSearchCells; dx++) {
    for (let dy = -maxSearchCells; dy <= maxSearchCells; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const checkX = originXY.x + (dx * gridCellSize);
      const checkY = originXY.y + (dy * gridCellSize);
      const neighborData = getCellDataAtXY(checkX, checkY);
      
      if (isCellTraversable(neighborData)) {
        const dist = Math.sqrt(Math.pow(dx * gridCellSize, 2) + Math.pow(dy * gridCellSize, 2));
        if (dist < minProjDist) {
          minProjDist = dist;
          const geo = xyToLatLon(checkX, checkY);
          closestValidPoint = { lat: geo.lat, lon: geo.lon, isResolved: true };
        }
      }
    }
  }

  return closestValidPoint;
}

/**
 * Standard DDA/Supercover Line algorithm for 2D grids.
 * Returns an array of canonical {col, row} cell indices that the line intersects.
 */
function getIntersectedCells(x1, y1, x2, y2) {
  const cellSize = 25000;
  const minX = -3500000;
  const minY = -3500000;
  
  const startCol = Math.floor((x1 - minX) / cellSize);
  const startRow = Math.floor((y1 - minY) / cellSize);
  const endCol = Math.floor((x2 - minX) / cellSize);
  const endRow = Math.floor((y2 - minY) / cellSize);
  
  const cells = [{ col: startCol, row: startRow }];
  
  let x = startCol;
  let y = startRow;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  const stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
  const stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
  
  if (stepX === 0 && stepY === 0) return cells;

  let voxelMaxX = minX + (x + (stepX > 0 ? 1 : 0)) * cellSize;
  let voxelMaxY = minY + (y + (stepY > 0 ? 1 : 0)) * cellSize;
  
  let tMaxX = stepX !== 0 ? (voxelMaxX - x1) / dx : Infinity;
  let tMaxY = stepY !== 0 ? (voxelMaxY - y1) / dy : Infinity;
  
  const tDeltaX = stepX !== 0 ? (cellSize * stepX) / dx : Infinity;
  const tDeltaY = stepY !== 0 ? (cellSize * stepY) / dy : Infinity;

  let iterations = 0;
  while (x !== endCol || y !== endRow) {
      if (iterations++ > 2000) break; // Sanity limit

      // If passing exactly through a corner, we must check both orthogonal adjacent cells
      // because we cannot cut diagonally through two blocked cells.
      if (Math.abs(tMaxX - tMaxY) < 1e-9) {
          cells.push({ col: x + stepX, row: y });
          cells.push({ col: x, row: y + stepY });
          x += stepX;
          y += stepY;
          tMaxX += tDeltaX;
          tMaxY += tDeltaY;
      } else if (tMaxX < tMaxY) {
          tMaxX += tDeltaX;
          x += stepX;
      } else {
          tMaxY += tDeltaY;
          y += stepY;
      }
      cells.push({ col: x, row: y });
  }
  
  return cells;
}

/**
 * Validates a final route's geometric segments to ensure strict safety.
 * Uses a supercover line algorithm to check EVERY intersected cell.
 * Returns true if valid, false if invalid.
 */
function validateRouteGeometry(waypoints) {
  if (!waypoints || waypoints.length < 2) return false;

  const minX = -3500000;
  const minY = -3500000;
  const cellSize = 25000;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = latLonToXY(waypoints[i].lat, waypoints[i].lon);
    const wp2 = latLonToXY(waypoints[i + 1].lat, waypoints[i + 1].lon);
    
    if (!wp1 || !wp2) return false;

    // Run supercover validation
    const intersectedCells = getIntersectedCells(wp1.x, wp1.y, wp2.x, wp2.y);
    for (const c of intersectedCells) {
      const cx = minX + c.col * cellSize + cellSize / 2;
      const cy = minY + c.row * cellSize + cellSize / 2;
      const cell = getCellDataAtXY(cx, cy);
      if (!isCellTraversable(cell)) {
        return false;
      }
    }
    
    // Explicit diagonal check for A* node pairs:
    // If the segment goes between adjacent diagonal cells, we must check both orthogonal neighbors
    const c1 = getIntersectedCells(wp1.x, wp1.y, wp1.x, wp1.y)[0];
    const c2 = getIntersectedCells(wp2.x, wp2.y, wp2.x, wp2.y)[0];
    if (Math.abs(c1.col - c2.col) === 1 && Math.abs(c1.row - c2.row) === 1) {
        // It's a diagonal step
        const o1x = minX + c2.col * cellSize + cellSize / 2;
        const o1y = minY + c1.row * cellSize + cellSize / 2;
        const o2x = minX + c1.col * cellSize + cellSize / 2;
        const o2y = minY + c2.row * cellSize + cellSize / 2;
        if (!isCellTraversable(getCellDataAtXY(o1x, o1y)) || !isCellTraversable(getCellDataAtXY(o2x, o2y))) {
            return false; // Cannot cut diagonally across blocked cells
        }
    }
  }
  return true;
}

/**
 * Samples spatial risk along a route at 25km intervals.
 */
export function evaluateRouteSpatialRisk(route) {
  if (!route.waypoints || route.waypoints.length < 2) {
    return null;
  }

  let totalRisk = 0;
  let maxRisk = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  let totalCompleteness = 0;
  let totalDistanceMeters = 0;

  const routePointsXY = [];

  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const wp1 = latLonToXY(route.waypoints[i].lat, route.waypoints[i].lon);
    const wp2 = latLonToXY(route.waypoints[i + 1].lat, route.waypoints[i + 1].lon);

    if (!wp1 || !wp2) continue;

    routePointsXY.push(wp1);

    const segmentDist = Math.sqrt(Math.pow(wp2.x - wp1.x, 2) + Math.pow(wp2.y - wp1.y, 2));
    totalDistanceMeters += segmentDist;
    
    const interval = 25000;
    const numSteps = Math.floor(segmentDist / interval);
    
    for (let j = 1; j <= numSteps; j++) {
      const ratio = (j * interval) / segmentDist;
      routePointsXY.push({
        x: wp1.x + (wp2.x - wp1.x) * ratio,
        y: wp1.y + (wp2.y - wp1.y) * ratio
      });
    }

    if (i === route.waypoints.length - 2) {
      routePointsXY.push(wp2);
    }
  }

  const distanceKm = totalDistanceMeters / 1000;
  let validSamples = 0;

  for (const point of routePointsXY) {
    const cellData = getCellDataAtXY(point.x, point.y);
    if (!cellData) continue;

    const risk = cellData.environmentalRisk;
    totalRisk += risk;
    totalCompleteness += cellData.riskDataCompleteness;
    validSamples++;

    if (risk > maxRisk) maxRisk = risk;
    if (risk >= 51) highRiskCount++;
    if (risk >= 76) criticalRiskCount++;
  }

  if (validSamples === 0) {
    return null; 
  }

  const averageRisk = totalRisk / validSamples;
  const highRiskExposurePercent = (highRiskCount / validSamples) * 100;
  const criticalRiskExposurePercent = (criticalRiskCount / validSamples) * 100;

  const routeRisk = Math.min(100, (averageRisk * 0.40) + (maxRisk * 0.20) + (highRiskExposurePercent * 0.15) + (criticalRiskExposurePercent * 0.25));

  let riskLevel = 'low';
  if (routeRisk > 25) riskLevel = 'moderate';
  if (routeRisk > 50) riskLevel = 'high';
  if (routeRisk > 75) riskLevel = 'critical';

  return {
    distanceKm,
    distanceNauticalMiles: distanceKm / 1.852,
    averageRisk,
    maximumRisk: maxRisk,
    highRiskExposurePercent,
    criticalRiskExposurePercent,
    routeRiskScore: Math.round(routeRisk),
    routeRiskLevel: riskLevel,
    routeDataCompleteness: totalCompleteness / validSamples,
    validSamples
  };
}

function mapObjectiveToEngine(uiObj) {
  if (uiObj === 'Fastest' || uiObj === 'Minimum Time') return 'FASTEST';
  if (uiObj === 'Fuel-efficient' || uiObj === 'Minimum Fuel') return 'FUEL_EFFICIENT';
  if (uiObj === 'Balanced' || uiObj === 'Balanced Routing') return 'BALANCED';
  return 'SAFEST';
}

/**
 * Main evaluation pipeline for Phase 3 A* generated geometry using Web Workers.
 * Returns a Promise.
 */
export async function generateRoutes({
  startPoint = null,
  endPoint = null,
  vessel = { maxSpeedKnots: 16.5 },
  objective = 'Balanced',
} = {}) {
  
  if (!startPoint || !endPoint) return [];

  const resolvedStart = resolveMaritimeAccessPoint(startPoint.lat, startPoint.lon);
  if (!resolvedStart) {
    return [{
      isInvalid: true,
      failureReason: "START_ON_LAND",
      routeRiskScore: 999
    }];
  }
  
  const resolvedEnd = resolveMaritimeAccessPoint(endPoint.lat, endPoint.lon);
  if (!resolvedEnd) {
    return [{
      isInvalid: true,
      failureReason: "DESTINATION_ON_LAND",
      routeRiskScore: 999
    }];
  }

  const engineObjective = mapObjectiveToEngine(objective);
  const speedKnots = vessel.maxSpeedKnots || vessel.speedKnots;
  let isSpeedValid = typeof speedKnots === 'number' && speedKnots > 0 && !Number.isNaN(speedKnots);

  if (engineObjective === 'FASTEST' && !isSpeedValid) {
    return [{
      isInvalid: true,
      failureReason: "INVALID_SPEED",
      routeRiskScore: 999
    }];
  }

  const envRev = getEnvironmentRevision();
  const cacheKey = `${resolvedStart.lat}_${resolvedStart.lon}_${resolvedEnd.lat}_${resolvedEnd.lon}_${vessel.id || 'unknown'}_${speedKnots}_${engineObjective}_${envRev}`;
  if (routeCache[cacheKey]) {
    return routeCache[cacheKey];
  }

  const grid = getSpatialRiskGrid();

  currentRequestId++;
  const reqId = currentRequestId;

  if (!astarWorker) {
    astarWorker = new Worker(new URL('./astarWorker.js', import.meta.url));
  }

  const aStarResult = await new Promise((resolve, reject) => {
    const handler = (event) => {
      if (event.data.requestId === reqId) {
        astarWorker.removeEventListener('message', handler);
        resolve(event.data);
      }
    };
    astarWorker.addEventListener('message', handler);
    
    astarWorker.postMessage({
      requestId: reqId,
      startPoint: resolvedStart,
      destinationPoint: resolvedEnd,
      grid,
      vessel,
      objective: engineObjective
    });
  });

  if (!aStarResult.success) {
    return [{
      isInvalid: true,
      failureReason: aStarResult.reason || "NO_ROUTE",
      routeRiskScore: 999
    }];
  }

  // Validate the final geometry independently
  if (!validateRouteGeometry(aStarResult.waypoints)) {
    return [{
      isInvalid: true,
      failureReason: "VALIDATION_ERROR",
      routeRiskScore: 999
    }];
  }

  const rawRoute = {
    id: 'a_star_generated',
    name: 'A* Optimized Route',
    waypoints: aStarResult.waypoints
  };
  
  const spatialMetrics = evaluateRouteSpatialRisk(rawRoute);
  
  if (!spatialMetrics) {
    return [{
      isInvalid: true,
      failureReason: "EVALUATION_FAILED",
      routeRiskScore: 999
    }];
  }

  const distanceKm = spatialMetrics.distanceKm;

  let estimatedTimeHours = 0;
  let estimatedDays = 0;
  if (isSpeedValid) {
    estimatedTimeHours = distanceKm / (speedKnots * 1.852);
    estimatedDays = Number((estimatedTimeHours / 24).toFixed(1));
  }

  const BASE_FUEL_RATE = 0.1; 
  const MAX_FUEL_PENALTY = 0.5;
  const fuelPenalty = 1 + ((spatialMetrics.routeRiskScore / 100) * MAX_FUEL_PENALTY);
  const estimatedFuelTons = Math.round(distanceKm * BASE_FUEL_RATE * fuelPenalty);

  const best = {
    ...rawRoute,
    isInvalid: false,
    isSpeedValid,
    distanceKm: Math.round(distanceKm),
    distanceNauticalMiles: Math.round(spatialMetrics.distanceNauticalMiles),
    routeRiskScore: spatialMetrics.routeRiskScore,
    riskBand: spatialMetrics.routeRiskLevel, 
    spatialMetrics,
    estimatedTimeHours,
    estimatedDays,
    estimatedFuelTons,
    isRecommended: true,
    engineNodesExpanded: aStarResult.nodesExpanded
  };
  
  if (engineObjective === 'SAFEST') {
    best.recommendationExplanation = `Route selected by A* to minimize environmental navigation risk. (${best.routeRiskScore}/100)`;
  } else if (engineObjective === 'FASTEST') {
    best.recommendationExplanation = `Route selected by A* to minimize estimated travel time (${best.estimatedDays} days) while applying environmental risk penalties.`;
  } else if (engineObjective === 'FUEL_EFFICIENT') {
    best.recommendationExplanation = `Route selected by A* to minimize estimated fuel consumption (${best.estimatedFuelTons} Tons) while accounting for environmental conditions. (Prototype fuel estimate)`;
  } else if (engineObjective === 'BALANCED') {
    best.recommendationExplanation = `Route selected by A* using the BALANCED objective to optimize safety, distance, time, and fuel.`;
  } else {
    best.recommendationExplanation = `Route generated successfully.`;
  }

  routeCache[cacheKey] = [best];
  return [best];
}

export default generateRoutes;
