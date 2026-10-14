// lib/astarWorker.js
// Phase 3.2: Multi-objective Web Worker wrapper for A* routing.

import { findOptimalPath } from './aStarEngine';

self.onmessage = function (event) {
  const {
    requestId,
    startPoint,
    destinationPoint,
    grid,
    vessel,
    objective,
    objectives,
  } = event.data;

  try {
    // Backwards compatible: older callers can still send one objective.
    const candidateObjectives = Array.isArray(objectives) && objectives.length
      ? [...new Set(objectives)]
      : [objective];

    // Run candidates sequentially so later strategies can mildly penalize
    // reusing the exact corridor selected by an earlier strategy. This makes
    // the comparison panel show genuine alternative paths when space allows.
    const results = [];
    const previousRoutes = [];

    for (const candidateObjective of candidateObjectives) {
      const result = findOptimalPath({
        startPoint,
        destinationPoint,
        grid,
        vessel,
        objective: candidateObjective,
        avoidWaypoints: previousRoutes.flat(),
      });

      results.push({
        objective: candidateObjective,
        ...result,
      });

      if (result.success && Array.isArray(result.waypoints)) {
        previousRoutes.push(result.waypoints);
      }
    }

    self.postMessage({
      requestId,
      success: true,
      results,
    });
  } catch (err) {
    self.postMessage({
      requestId,
      success: false,
      reason: 'WORKER_ERROR',
      errorMessage: err?.message || 'Unknown worker error',
      results: [],
    });
  }
};
