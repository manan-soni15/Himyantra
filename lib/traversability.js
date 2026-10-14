// lib/traversability.js
// Phase 3.2: Canonical traversability logic with vessel-aware ice exposure.

const ICE_CLASS_LIMITS = {
  PC1: 95,
  PC2: 90,
  PC3: 85,
  PC4: 75,
  PC5: 65,
  PC6: 45,
  PC7: 30,
  UNCLASSED: 15,
};

export function calculateEffectiveRoutingRisk(cell) {
  if (!cell) return null;
  if (cell.riskDataCompleteness === 0) return null;

  const r = Number(cell.environmentalRisk ?? 0);
  const c = Number(cell.riskDataCompleteness ?? 0);

  return Math.min(100, r + (1 - c) * 15);
}

export function getVesselIceLimit(vessel) {
  const iceClass = String(vessel?.iceClass || 'UNCLASSED').toUpperCase();
  return ICE_CLASS_LIMITS[iceClass] ?? ICE_CLASS_LIMITS.UNCLASSED;
}

/**
 * Adjusts environmental routing risk for the selected vessel's ice capability.
 * This is deliberately a routing penalty rather than a change to the observed
 * sea-ice concentration itself.
 */
export function calculateVesselAdjustedRisk(cell, vessel = null) {
  const baseRisk = calculateEffectiveRoutingRisk(cell);
  if (baseRisk === null) return null;
  if (!vessel || cell?.seaIceRisk == null) return baseRisk;

  const concentration = Number(cell.seaIceRisk);
  const limit = getVesselIceLimit(vessel);

  if (!Number.isFinite(concentration) || !Number.isFinite(limit) || limit <= 0) {
    return baseRisk;
  }

  const ratio = concentration / limit;
  let vesselPenalty = 0;

  if (ratio > 1.50) vesselPenalty = 40;
  else if (ratio > 1.25) vesselPenalty = 28;
  else if (ratio > 1.00) vesselPenalty = 15;
  else if (ratio > 0.85) vesselPenalty = 5;

  return Math.min(100, baseRisk + vesselPenalty);
}

export function isCellTraversable(cell, vessel = null) {
  if (!cell) return false;
  if (cell.isLand === true) return false;
  if (cell.isNavigable === false) return false;
  if (cell.riskDataCompleteness === 0) return false;

  const effectiveRisk = calculateVesselAdjustedRisk(cell, vessel);
  if (effectiveRisk === null) return false;
  if (effectiveRisk >= 90) return false;

  return true;
}
