// lib/aStarEngine.js
// Final Phase 3.1: Actual A* Route Optimization Engine

import { latLonToXY, xyToLatLon, isValidLatLon } from './coordinateUtils';
import { GRID_MIN_X, GRID_MAX_X, GRID_MIN_Y, GRID_MAX_Y, GRID_CELL_SIZE_M, GRID_COLUMNS, GRID_ROWS, getColRowFromXY } from './gridUtils';

class MinHeap {
  constructor() {
    this.heap = [];
  }
  
  push(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(index) {
    const node = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (this._compare(node, parent) < 0) {
        this.heap[index] = parent;
        this.heap[parentIndex] = node;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const node = this.heap[index];
    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let leftChild, rightChild;
      let swapIdx = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (this._compare(leftChild, node) < 0) {
          swapIdx = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swapIdx === null && this._compare(rightChild, node) < 0) ||
          (swapIdx !== null && this._compare(rightChild, leftChild) < 0)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;
      
      this.heap[index] = this.heap[swapIdx];
      this.heap[swapIdx] = node;
      index = swapIdx;
    }
  }

  _compare(a, b) {
    if (a.fScore !== b.fScore) return a.fScore - b.fScore;
    if (a.hScore !== b.hScore) return a.hScore - b.hScore;
    return a.index - b.index;
  }
}

function getCellFromLatLon(lat, lon) {
  if (!isValidLatLon(lat, lon)) return null;
  const projected = latLonToXY(lat, lon);
  if (!projected) return null;

  const cr = getColRowFromXY(projected.x, projected.y);
  if (!cr) return null;
  
  return { col: cr.col, row: cr.row, index: cr.col * GRID_ROWS + cr.row };
}

// grid is 1D array ordered by col * GRID_ROWS + row
function getGridCell(grid, col, row) {
  if (col < 0 || col >= GRID_COLUMNS || row < 0 || row >= GRID_ROWS) return null;
  const index = col * GRID_ROWS + row;
  return grid[index];
}

// Cell traversability using the precomputed effective risk logic
function isCellTraversableLocal(cell) {
  if (!cell) return false;
  if (cell.isLand) return false;
  if (cell.isNavigable === false) return false;
  if (cell.riskDataCompleteness === 0) return false;
  if (cell.effectiveRoutingRisk >= 90) return false;
  return true;
}

function getHeuristic(col, row, destCol, destRow, objective, vesselSpeedKnots) {
  const dx = Math.abs(col - destCol);
  const dy = Math.abs(row - destRow);
  const dGeom = GRID_CELL_SIZE_M * (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy));
  
  if (objective === 'SAFEST') {
    return dGeom;
  } else if (objective === 'FUEL_EFFICIENT') {
    return (dGeom / 1000) * 0.1; // Base fuel rate
  } else if (objective === 'FASTEST') {
    return (dGeom / 1000) / (vesselSpeedKnots * 1.852);
  } else if (objective === 'BALANCED') {
    // Admissible heuristic: only non-risk geometric components
    const distanceNormalized = dGeom / 25000;
    const edgeTimeHours = (dGeom / 1000) / (vesselSpeedKnots * 1.852);
    const referenceTime = 25 / (vesselSpeedKnots * 1.852);
    const timeNormalized = edgeTimeHours / referenceTime;
    const referenceFuel = 25 * 0.1;
    const edgeFuel = (dGeom / 1000) * 0.1; // 0 risk penalty for admissibility
    const fuelNormalized = edgeFuel / referenceFuel;
    
    // Safety has 0 minimum cost
    return (0.25 * timeNormalized) + (0.20 * fuelNormalized) + (0.15 * distanceNormalized);
  }
  return 0; // Default admissible fallback
}

export function findOptimalPath({ startPoint, destinationPoint, grid, vessel, objective }) {
  if (!grid || grid.length === 0) return { success: false, reason: "GRID_MISSING" };

  const startCell = getCellFromLatLon(startPoint.lat, startPoint.lon);
  if (!startCell) return { success: false, reason: "START_INVALID" };

  const destCell = getCellFromLatLon(destinationPoint.lat, destinationPoint.lon);
  if (!destCell) return { success: false, reason: "DESTINATION_INVALID" };

  const startGridCell = getGridCell(grid, startCell.col, startCell.row);
  const destGridCell = getGridCell(grid, destCell.col, destCell.row);

  if (!isCellTraversableLocal(startGridCell)) return { success: false, reason: "START_BLOCKED" };
  if (!isCellTraversableLocal(destGridCell)) return { success: false, reason: "DESTINATION_BLOCKED" };

  // Strict speed validation for time-dependent objectives
  const vesselSpeedKnots = vessel?.maxSpeedKnots || vessel?.speedKnots;
  if (objective === 'FASTEST' || objective === 'BALANCED') {
    if (typeof vesselSpeedKnots !== 'number' || vesselSpeedKnots <= 0 || !Number.isFinite(vesselSpeedKnots)) {
      return { success: false, reason: "INVALID_VESSEL_SPEED" };
    }
  }

  if (startCell.index === destCell.index) {
    return {
      success: true,
      waypoints: [startPoint, destinationPoint]
    };
  }

  const numCells = GRID_COLUMNS * GRID_ROWS;
  const gScore = new Float64Array(numCells);
  gScore.fill(Infinity);
  const cameFrom = new Int32Array(numCells);
  cameFrom.fill(-1);

  const openSet = new MinHeap();
  
  gScore[startCell.index] = 0;
  const initialH = getHeuristic(startCell.col, startCell.row, destCell.col, destCell.row, objective, vesselSpeedKnots);
  openSet.push({ index: startCell.index, col: startCell.col, row: startCell.row, fScore: initialH, hScore: initialH });

  let nodesExpanded = 0;
  const MAX_NODES = 78400; // entire graph
  
  const neighbors = [
    [0, -1, false], [0, 1, false], [1, 0, false], [-1, 0, false],
    [1, -1, true], [-1, -1, true], [1, 1, true], [-1, 1, true]
  ];

  const vesselSpeedKmH = vesselSpeedKnots * 1.852;
  const FASTEST_RISK_DELAY_HOURS = 10;
  const BASE_FUEL_RATE = 0.1;
  const MAX_FUEL_PENALTY = 0.5;

  while (!openSet.isEmpty()) {
    if (nodesExpanded >= MAX_NODES) return { success: false, reason: "SEARCH_LIMIT" };

    const current = openSet.pop();
    
    if (current.index === destCell.index) {
      const pathWaypoints = [];
      let currIdx = destCell.index;
      
      while (currIdx !== startCell.index) {
        const cRow = currIdx % GRID_ROWS;
        const cCol = Math.floor(currIdx / GRID_ROWS);
        const centerX = GRID_MIN_X + (cCol + 0.5) * GRID_CELL_SIZE_M;
        const centerY = GRID_MIN_Y + (cRow + 0.5) * GRID_CELL_SIZE_M;
        
        const geo = xyToLatLon(centerX, centerY);
        if (geo) {
          pathWaypoints.push({ lat: geo.lat, lon: geo.lon });
        }
        currIdx = cameFrom[currIdx];
      }
      
      pathWaypoints.reverse();
      const finalWaypoints = [startPoint, ...pathWaypoints, destinationPoint];
      
      return { success: true, waypoints: finalWaypoints, nodesExpanded };
    }

    nodesExpanded++;

    for (const [dCol, dRow, isDiag] of neighbors) {
      const nCol = current.col + dCol;
      const nRow = current.row + dRow;

      if (nCol < 0 || nCol >= GRID_COLUMNS || nRow < 0 || nRow >= GRID_ROWS) continue;
      
      const nIndex = nCol * GRID_ROWS + nRow;
      const neighborCell = getGridCell(grid, nCol, nRow);
      
      if (!isCellTraversableLocal(neighborCell)) continue;
      
      // Strict diagonal / corner-cutting validation
      if (isDiag) {
        const orth1Cell = getGridCell(grid, current.col + dCol, current.row);
        const orth2Cell = getGridCell(grid, current.col, current.row + dRow);
        
        // If either orthogonal cell is non-traversable (land, unknown, blocked risk >= 90), 
        // the diagonal move is strictly forbidden.
        if (!isCellTraversableLocal(orth1Cell) || !isCellTraversableLocal(orth2Cell)) {
          continue; 
        }
      }

      const distM = isDiag ? GRID_CELL_SIZE_M * Math.SQRT2 : GRID_CELL_SIZE_M;
      const rEff = neighborCell.effectiveRoutingRisk;
      const R_normalized = rEff / 100;
      let edgeCost = 0;

      if (objective === 'SAFEST') {
        edgeCost = distM * (1 + R_normalized * 20);
      } else if (objective === 'FUEL_EFFICIENT') {
        const localFuelPenalty = 1 + (R_normalized * MAX_FUEL_PENALTY);
        edgeCost = (distM / 1000) * BASE_FUEL_RATE * localFuelPenalty;
      } else if (objective === 'FASTEST') {
        const edgeTimeHours = (distM / 1000) / vesselSpeedKmH;
        const riskDelay = R_normalized * FASTEST_RISK_DELAY_HOURS;
        edgeCost = edgeTimeHours + riskDelay;
      } else if (objective === 'BALANCED') {
        const distanceNormalized = distM / 25000;
        
        const referenceTime = 25 / vesselSpeedKmH;
        const edgeTimeHours = (distM / 1000) / vesselSpeedKmH;
        const timeNormalized = edgeTimeHours / referenceTime;
        
        const referenceFuel = 25 * BASE_FUEL_RATE;
        const edgeFuel = (distM / 1000) * BASE_FUEL_RATE * (1 + R_normalized * MAX_FUEL_PENALTY);
        const fuelNormalized = edgeFuel / referenceFuel;
        
        const safetyNormalized = R_normalized;
        
        edgeCost = (0.40 * safetyNormalized) + (0.25 * timeNormalized) + (0.20 * fuelNormalized) + (0.15 * distanceNormalized);
      }

      const tentativeG = gScore[current.index] + edgeCost;

      if (tentativeG < gScore[nIndex]) {
        cameFrom[nIndex] = current.index;
        gScore[nIndex] = tentativeG;
        
        const h = getHeuristic(nCol, nRow, destCell.col, destCell.row, objective, vesselSpeedKnots);
        const fScore = tentativeG + h;
        
        openSet.push({ index: nIndex, col: nCol, row: nRow, fScore, hScore: h });
      }
    }
  }

  return { success: false, reason: "NO_ROUTE", nodesExpanded };
}
