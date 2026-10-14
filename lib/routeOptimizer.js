// lib/routeOptimizer.js
// Phase 3.2: Multi-route A* Decision Support with spatial risk evaluation.

import {
  getCellDataAtXY,
  getSpatialRiskGrid,
  getEnvironmentRevision,
} from './spatialRiskGrid';
import { latLonToXY, xyToLatLon } from './coordinateUtils';
import { isCellTraversable } from './traversability';

let astarWorker = null;
let currentRequestId = 0;
const routeCache = {};

const ROUTE_PROFILES = {
  SAFEST: {
    label: 'Safety-first',
    name: 'Safety-First Route',
    description: 'Prioritizes low environmental risk and avoids hazardous cells.',
  },
  BALANCED: {
    label: 'Balanced',
    name: 'Balanced Route',
    description: 'Balances safety, travel time, distance, and estimated fuel.',
  },
  FUEL_EFFICIENT: {
    label: 'Fuel-efficient',
    name: 'Fuel-Efficient Route',
    description: 'Prioritizes lower estimated fuel use while retaining risk penalties.',
  },
  FASTEST: {
    label: 'Fastest',
    name: 'Fastest Route',
    description: 'Prioritizes travel time while penalizing hazardous conditions.',
  },
};

function normalizeObjective(uiObj) {
  if (uiObj === 'Fastest' || uiObj === 'Minimum Time' || uiObj === 'FASTEST') return 'FASTEST';
  if (uiObj === 'Fuel-efficient' || uiObj === 'Minimum Fuel' || uiObj === 'FUEL_EFFICIENT') return 'FUEL_EFFICIENT';
  if (uiObj === 'Balanced' || uiObj === 'Balanced Routing' || uiObj === 'BALANCED') return 'BALANCED';
  return 'SAFEST';
}

function getCandidateObjectives(requestedObjective) {
  const objective = normalizeObjective(requestedObjective);
  const profiles = {
    SAFEST: ['SAFEST', 'BALANCED', 'FASTEST'],
    BALANCED: ['SAFEST', 'BALANCED', 'FUEL_EFFICIENT'],
    FUEL_EFFICIENT: ['FUEL_EFFICIENT', 'BALANCED', 'FASTEST'],
    FASTEST: ['FASTEST', 'BALANCED', 'SAFEST'],
  };
  return profiles[objective] || profiles.BALANCED;
}

/**
 * Resolves a coordinate (possibly on land) to the nearest traversable maritime cell.
 */
export function resolveMaritimeAccessPoint(lat, lon, vessel = null) {
  const originXY = latLonToXY(lat, lon);
  if (!originXY) return null;

  const gridCellSize = 25000;
  const cellData = getCellDataAtXY(originXY.x, originXY.y);
  if (isCellTraversable(cellData, vessel)) {
    return { lat, lon, isResolved: false };
  }

  const maxSearchDistKm = 100;
  const maxSearchCells = Math.ceil((maxSearchDistKm * 1000) / gridCellSize);
  let closestValidPoint = null;
  let minProjDist = Infinity;

  for (let dx = -maxSearchCells; dx <= maxSearchCells; dx++) {
    for (let dy = -maxSearchCells; dy <= maxSearchCells; dy++) {
      if (dx === 0 && dy === 0) continue;

      const checkX = originXY.x + dx * gridCellSize;
      const checkY = originXY.y + dy * gridCellSize;
      const neighborData = getCellDataAtXY(checkX, checkY);

      if (isCellTraversable(neighborData, vessel)) {
        const dist = Math.hypot(dx * gridCellSize, dy * gridCellSize);
        if (dist < minProjDist) {
          minProjDist = dist;
          const geo = xyToLatLon(checkX, checkY);
          if (geo) {
            closestValidPoint = {
              lat: geo.lat,
              lon: geo.lon,
              isResolved: true,
            };
          }
        }
      }
    }
  }

  return closestValidPoint;
}

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
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

  if (stepX === 0 && stepY === 0) return cells;

  const voxelMaxX = minX + (x + (stepX > 0 ? 1 : 0)) * cellSize;
  const voxelMaxY = minY + (y + (stepY > 0 ? 1 : 0)) * cellSize;
  let tMaxX = stepX !== 0 ? (voxelMaxX - x1) / dx : Infinity;
  let tMaxY = stepY !== 0 ? (voxelMaxY - y1) / dy : Infinity;
  const tDeltaX = stepX !== 0 ? (cellSize * stepX) / dx : Infinity;
  const tDeltaY = stepY !== 0 ? (cellSize * stepY) / dy : Infinity;

  let iterations = 0;
  while (x !== endCol || y !== endRow) {
    if (iterations++ > 2000) break;

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

function validateRouteGeometry(waypoints, vessel = null) {
  if (!waypoints || waypoints.length < 2) return false;

  const minX = -3500000;
  const minY = -3500000;
  const cellSize = 25000;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = latLonToXY(waypoints[i].lat, waypoints[i].lon);
    const wp2 = latLonToXY(waypoints[i + 1].lat, waypoints[i + 1].lon);
    if (!wp1 || !wp2) return false;

    const intersectedCells = getIntersectedCells(wp1.x, wp1.y, wp2.x, wp2.y);
    for (const c of intersectedCells) {
      const cx = minX + c.col * cellSize + cellSize / 2;
      const cy = minY + c.row * cellSize + cellSize / 2;
      if (!isCellTraversable(getCellDataAtXY(cx, cy), vessel)) return false;
    }
  }

  return true;
}

/**
 * Samples spatial risk along a route at 25 km intervals and returns a richer
 * hazard profile so the UI can explain why a route was selected.
 */
export function evaluateRouteSpatialRisk(route) {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  let totalRisk = 0;
  let maxRisk = 0;
  let highRiskCount = 0;
  let criticalRiskCount = 0;
  let totalCompleteness = 0;
  let totalDistanceMeters = 0;

  let totalSeaIce = 0;
  let totalIceberg = 0;
  let totalWeather = 0;
  let componentSamples = 0;
  let validSamples = 0;

  const routePointsXY = [];

  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const wp1 = latLonToXY(route.waypoints[i].lat, route.waypoints[i].lon);
    const wp2 = latLonToXY(route.waypoints[i + 1].lat, route.waypoints[i + 1].lon);
    if (!wp1 || !wp2) continue;

    routePointsXY.push(wp1);
    const segmentDist = Math.hypot(wp2.x - wp1.x, wp2.y - wp1.y);
    totalDistanceMeters += segmentDist;

    const interval = 25000;
    const numSteps = Math.floor(segmentDist / interval);

    for (let j = 1; j <= numSteps; j++) {
      const ratio = (j * interval) / segmentDist;
      routePointsXY.push({
        x: wp1.x + (wp2.x - wp1.x) * ratio,
        y: wp1.y + (wp2.y - wp1.y) * ratio,
      });
    }

    if (i === route.waypoints.length - 2) routePointsXY.push(wp2);
  }

  for (const point of routePointsXY) {
    const cellData = getCellDataAtXY(point.x, point.y);
    if (!cellData) continue;

    const risk = Number(cellData.environmentalRisk ?? 0);
    totalRisk += risk;
    totalCompleteness += Number(cellData.riskDataCompleteness ?? 0);
    validSamples++;

    if (risk > maxRisk) maxRisk = risk;
    if (risk >= 51) highRiskCount++;
    if (risk >= 76) criticalRiskCount++;

    if (Number.isFinite(cellData.seaIceRisk) || Number.isFinite(cellData.icebergRisk) || Number.isFinite(cellData.weatherRisk)) {
      totalSeaIce += Number(cellData.seaIceRisk ?? 0);
      totalIceberg += Number(cellData.icebergRisk ?? 0);
      totalWeather += Number(cellData.weatherRisk ?? 0);
      componentSamples++;
    }
  }

  if (validSamples === 0) return null;

  const distanceKm = totalDistanceMeters / 1000;
  const averageRisk = totalRisk / validSamples;
  const highRiskExposurePercent = (highRiskCount / validSamples) * 100;
  const criticalRiskExposurePercent = (criticalRiskCount / validSamples) * 100;
  const routeRisk = Math.min(
    100,
    averageRisk * 0.40 +
      maxRisk * 0.20 +
      highRiskExposurePercent * 0.15 +
      criticalRiskExposurePercent * 0.25
  );

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
    averageSeaIceRisk: componentSamples ? totalSeaIce / componentSamples : null,
    averageIcebergRisk: componentSamples ? totalIceberg / componentSamples : null,
    averageWeatherRisk: componentSamples ? totalWeather / componentSamples : null,
    validSamples,
  };
}

function getWorker() {
  if (!astarWorker) {
    astarWorker = new Worker(new URL('./astarWorker.js', import.meta.url));
  }
  return astarWorker;
}

async function runAStarCandidates({ startPoint, endPoint, grid, vessel, objectives }) {
  const worker = getWorker();
  currentRequestId += 1;
  const reqId = currentRequestId;

  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data?.requestId !== reqId) return;
      worker.removeEventListener('message', handler);
      resolve(event.data);
    };

    worker.addEventListener('message', handler);
    worker.postMessage({
      requestId: reqId,
      startPoint,
      destinationPoint: endPoint,
      grid,
      vessel,
      objective: objectives[0],
      objectives,
    });
  });
}

function createRouteFingerprint(waypoints) {
  return waypoints
    .map((point) => `${Number(point.lat).toFixed(3)}:${Number(point.lon).toFixed(3)}`)
    .join('|');
}

function enrichRoute({ result, objective, vessel }) {
  if (!result?.success) return null;

  const rawRoute = {
    id: `a_star_${objective.toLowerCase()}`,
    name: ROUTE_PROFILES[objective]?.name || `${objective} Route`,
    strategyObjective: objective,
    strategyLabel: ROUTE_PROFILES[objective]?.label || objective,
    description: ROUTE_PROFILES[objective]?.description || '',
    waypoints: result.waypoints,
  };

  if (!validateRouteGeometry(rawRoute.waypoints, vessel)) return null;

  const spatialMetrics = evaluateRouteSpatialRisk(rawRoute);
  if (!spatialMetrics) return null;

  const speedKnots = vessel?.maxSpeedKnots || vessel?.speedKnots;
  const isSpeedValid = Number.isFinite(speedKnots) && speedKnots > 0;
  const distanceKm = spatialMetrics.distanceKm;
  const estimatedTimeHours = isSpeedValid ? distanceKm / (speedKnots * 1.852) : 0;
  const estimatedDays = isSpeedValid ? Number((estimatedTimeHours / 24).toFixed(1)) : 0;

  const BASE_FUEL_RATE = 0.1;

  // Prototype fuel model: estimated burn increases with environmental
  // resistance (sea ice, iceberg exposure, weather, and composite risk).
  // Strategy profiles also represent the intended operating mode: fastest
  // prioritizes speed, while fuel-efficient prioritizes lower burn.
  const seaIceResistance = Number(spatialMetrics.averageSeaIceRisk ?? 0) / 100;
  const icebergResistance = Number(spatialMetrics.averageIcebergRisk ?? 0) / 100;
  const weatherResistance = Number(spatialMetrics.averageWeatherRisk ?? 0) / 100;
  const compositeRisk = Number(spatialMetrics.routeRiskScore ?? 0) / 100;

  const environmentalResistance =
    1 +
    seaIceResistance * 0.25 +
    icebergResistance * 0.15 +
    weatherResistance * 0.10 +
    compositeRisk * 0.15;

  const strategyFuelFactor = {
    SAFEST: 0.98,
    BALANCED: 1.00,
    FUEL_EFFICIENT: 0.90,
    FASTEST: 1.08,
  }[objective] ?? 1.00;

  const estimatedFuelTons = Number(
    (distanceKm * BASE_FUEL_RATE * environmentalResistance * strategyFuelFactor).toFixed(1)
  );

  return {
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
    engineNodesExpanded: result.nodesExpanded,
    recommendationExplanation: '',
    fingerprint: createRouteFingerprint(rawRoute.waypoints),
  };
}

function compareForObjective(a, b, objective) {
  if (objective === 'FASTEST') {
    return a.estimatedTimeHours - b.estimatedTimeHours || a.routeRiskScore - b.routeRiskScore;
  }
  if (objective === 'FUEL_EFFICIENT') {
    return a.estimatedFuelTons - b.estimatedFuelTons || a.routeRiskScore - b.routeRiskScore;
  }
  if (objective === 'SAFEST') {
    return a.routeRiskScore - b.routeRiskScore || a.estimatedFuelTons - b.estimatedFuelTons;
  }

  // Balanced: normalize the candidate metrics so no single unit dominates.
  return 0;
}

function rankCandidates(routes, objective) {
  if (routes.length <= 1) return routes;

  if (objective !== 'BALANCED') {
    return [...routes].sort((a, b) => compareForObjective(a, b, objective));
  }

  const metrics = {
    risk: routes.map((r) => r.routeRiskScore),
    fuel: routes.map((r) => r.estimatedFuelTons),
    time: routes.map((r) => r.estimatedTimeHours),
    distance: routes.map((r) => r.distanceNauticalMiles),
  };

  const normalize = (value, values) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return 0;
    return (value - min) / (max - min);
  };

  return [...routes]
    .map((route) => ({
      route,
      balancedScore:
        0.45 * normalize(route.routeRiskScore, metrics.risk) +
        0.25 * normalize(route.estimatedFuelTons, metrics.fuel) +
        0.20 * normalize(route.estimatedTimeHours, metrics.time) +
        0.10 * normalize(route.distanceNauticalMiles, metrics.distance),
    }))
    .sort((a, b) => a.balancedScore - b.balancedScore)
    .map((item) => item.route);
}

function buildExplanation(route, requestedObjective) {
  const objectiveLabel = ROUTE_PROFILES[requestedObjective]?.label || 'selected';
  const risk = route.routeRiskScore;
  const maxRisk = Math.round(route.spatialMetrics.maximumRisk);
  const fuel = route.estimatedFuelTons;
  const days = route.estimatedDays;

  if (requestedObjective === 'SAFEST') {
    return `Selected for ${objectiveLabel.toLowerCase()} routing: ${risk}/100 route risk, ${maxRisk}/100 peak encounter risk, while avoiding the most hazardous cells.`;
  }
  if (requestedObjective === 'FASTEST') {
    return `Selected for ${objectiveLabel.toLowerCase()} routing: approximately ${days} days at the active vessel speed, with environmental risk penalties applied.`;
  }
  if (requestedObjective === 'FUEL_EFFICIENT') {
    return `Selected for ${objectiveLabel.toLowerCase()} routing: estimated ${fuel} tons of fuel while still penalizing higher-risk cells.`;
  }
  return `Selected as the best ${objectiveLabel.toLowerCase()} trade-off across risk, fuel, travel time, and route distance.`;
}

export async function generateRoutes({
  startPoint = null,
  endPoint = null,
  vessel = { maxSpeedKnots: 16.5 },
  objective = 'Balanced',
} = {}) {
  if (!startPoint || !endPoint) return [];

  const requestedObjective = normalizeObjective(objective);
  const candidateObjectives = getCandidateObjectives(requestedObjective);

  const resolvedStart = resolveMaritimeAccessPoint(startPoint.lat, startPoint.lon, vessel);
  if (!resolvedStart) {
    return [{ isInvalid: true, failureReason: 'START_ON_LAND', routeRiskScore: 999 }];
  }

  const resolvedEnd = resolveMaritimeAccessPoint(endPoint.lat, endPoint.lon, vessel);
  if (!resolvedEnd) {
    return [{ isInvalid: true, failureReason: 'DESTINATION_ON_LAND', routeRiskScore: 999 }];
  }

  const speedKnots = vessel.maxSpeedKnots || vessel.speedKnots;
  const isSpeedValid = typeof speedKnots === 'number' && speedKnots > 0 && Number.isFinite(speedKnots);

  if ((candidateObjectives.includes('FASTEST') || candidateObjectives.includes('BALANCED')) && !isSpeedValid) {
    // Keep the requested objective failure explicit; SAFEST/FUEL can still be computed if requested.
    if (requestedObjective === 'FASTEST' || requestedObjective === 'BALANCED') {
      return [{ isInvalid: true, failureReason: 'INVALID_SPEED', routeRiskScore: 999 }];
    }
  }

  const envRev = getEnvironmentRevision();
  const cacheKey = [
    'v2',
    resolvedStart.lat,
    resolvedStart.lon,
    resolvedEnd.lat,
    resolvedEnd.lon,
    vessel.id || 'unknown',
    speedKnots,
    requestedObjective,
    candidateObjectives.join('-'),
    envRev,
  ].join('_');

  if (routeCache[cacheKey]) return routeCache[cacheKey];

  const grid = getSpatialRiskGrid();
  const aStarResult = await runAStarCandidates({
    startPoint: resolvedStart,
    endPoint: resolvedEnd,
    grid,
    vessel,
    objectives: candidateObjectives,
  });

  if (!aStarResult.success && (!aStarResult.results || aStarResult.results.length === 0)) {
    const failure = {
      isInvalid: true,
      failureReason: aStarResult.reason || 'NO_ROUTE',
      routeRiskScore: 999,
    };
    return [failure];
  }

  const candidateRoutes = [];
  let requestedFailure = null;

  for (const result of aStarResult.results || []) {
    if (!result.success) {
      if (result.objective === requestedObjective) requestedFailure = result.reason;
      continue;
    }

    const route = enrichRoute({
      result,
      objective: result.objective,
      vessel,
    });

    if (route) candidateRoutes.push(route);
  }

  // Remove duplicate geometries so the comparison table shows genuine alternatives.
  const uniqueRoutes = [];
  const seenFingerprints = new Set();
  for (const route of candidateRoutes) {
    if (seenFingerprints.has(route.fingerprint)) continue;
    seenFingerprints.add(route.fingerprint);
    uniqueRoutes.push(route);
  }

  if (uniqueRoutes.length === 0) {
    return [{
      isInvalid: true,
      failureReason: requestedFailure || 'NO_ROUTE',
      routeRiskScore: 999,
    }];
  }

  const ranked = rankCandidates(uniqueRoutes, requestedObjective);
  const requestedCandidate = ranked.find((route) => route.strategyObjective === requestedObjective);
  const recommended = ranked[0];

  const requestedObjectiveAvailable = Boolean(requestedCandidate);
  const finalRoutes = ranked.map((route, index) => ({
    ...route,
    rank: index + 1,
    isRecommended: route.id === recommended.id,
    recommendationExplanation: route.id === recommended.id
      ? buildExplanation(route, requestedObjective) + (!requestedObjectiveAvailable ? ' The selected strategy was unavailable, so the best available candidate is shown.' : '')
      : `${ROUTE_PROFILES[route.strategyObjective]?.label || 'Alternative'} candidate for comparison against the selected objective.`,
  }));

  // Avoid exposing the internal fingerprint to the UI.
  const cleanRoutes = finalRoutes.map(({ fingerprint, ...route }) => route);

  routeCache[cacheKey] = cleanRoutes;
  return cleanRoutes;
}

export default generateRoutes;
