// lib/astarWorker.js
// Final Phase 3.1: Web Worker for A* Execution

import { findOptimalPath } from './aStarEngine';

self.onmessage = function (event) {
  const { requestId, startPoint, destinationPoint, grid, vessel, objective } = event.data;
  
  try {
    const result = findOptimalPath({ startPoint, destinationPoint, grid, vessel, objective });
    
    // Add the requestId so the main thread can discard stale results
    self.postMessage({
      requestId,
      ...result
    });
  } catch (err) {
    self.postMessage({
      requestId,
      success: false,
      reason: "WORKER_ERROR",
      errorMessage: err.message
    });
  }
};
