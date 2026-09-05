// test-a-star.js
import { findOptimalPath } from './lib/aStarEngine.js';
import { getSpatialRiskGrid } from './lib/spatialRiskGrid.js';

// Setup mock grid
const grid = getSpatialRiskGrid();

console.log("Grid generated with", grid.length, "cells.");

// Test 1: Safest objective
console.log("\n--- TEST 1: SAFEST OBJECTIVE ---");
const startPoint = { lat: -54.80, lon: -68.30 }; // Ushuaia area
const destinationPoint = { lat: -64.77, lon: -64.08 }; // Palmer station area

const resultSafest = findOptimalPath({
  startPoint,
  destinationPoint,
  grid,
  vessel: { maxSpeedKnots: 15 },
  objective: 'SAFEST'
});

console.log("Success:", resultSafest.success);
if (resultSafest.success) {
  console.log("Nodes expanded:", resultSafest.nodesExpanded);
  console.log("Path waypoints length:", resultSafest.waypoints.length);
} else {
  console.log("Failure reason:", resultSafest.reason);
}

// Test 2: Balanced objective
console.log("\n--- TEST 2: BALANCED OBJECTIVE ---");
const resultBalanced = findOptimalPath({
  startPoint,
  destinationPoint,
  grid,
  vessel: { maxSpeedKnots: 15 },
  objective: 'BALANCED'
});

console.log("Success:", resultBalanced.success);
if (resultBalanced.success) {
  console.log("Nodes expanded:", resultBalanced.nodesExpanded);
  console.log("Path waypoints length:", resultBalanced.waypoints.length);
} else {
  console.log("Failure reason:", resultBalanced.reason);
}

// Test 3: Land blocking
console.log("\n--- TEST 3: START ON LAND ---");
const resultLand = findOptimalPath({
  startPoint: { lat: -80, lon: 0 }, // Deep inland Antarctica
  destinationPoint,
  grid,
  vessel: { maxSpeedKnots: 15 },
  objective: 'SAFEST'
});
console.log("Success:", resultLand.success);
console.log("Failure reason (should be START_BLOCKED):", resultLand.reason);

console.log("\nAll tests executed.");
