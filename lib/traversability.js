// lib/traversability.js
// Canonical Traversability Logic for Phase 3.1

export function calculateEffectiveRoutingRisk(cell) {
    if (!cell) return null;
    // 0/3 data completeness case => treat as UNKNOWN
    if (cell.riskDataCompleteness === 0) {
        return null; 
    }
    const r = cell.environmentalRisk;
    const c = cell.riskDataCompleteness;
    const effectiveRisk = Math.min(100, r + ((1 - c) * 15));
    return effectiveRisk;
}

export function isCellTraversable(cell, vessel = null) {
    if (!cell) return false;
    
    // Check if cell is strictly land
    if (cell.isLand === true) return false;
    
    // Check basic navigability flag
    if (cell.isNavigable === false) return false;
    
    // UNKNOWN check (0/3 data)
    if (cell.riskDataCompleteness === 0) return false;
    
    // Risk blocking
    const effectiveRisk = calculateEffectiveRoutingRisk(cell);
    if (effectiveRisk === null) return false;
    if (effectiveRisk >= 90) return false;
    
    return true;
}
