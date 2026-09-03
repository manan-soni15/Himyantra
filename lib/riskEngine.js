// lib/riskEngine.js
//
// TODO: Implement navigation risk scoring.
// This will eventually combine sea-ice concentration, iceberg proximity,
// weather severity, and vessel ice-class to produce a single risk score
// (and the "Safe / Moderate / High / Critical" status bands used across the UI).
//
// Planned inputs: seaIceConcentration, icebergProximity, weatherSeverity, vesselIceClass
// Planned output: { score: number, level: 'safe' | 'moderate' | 'high' | 'critical', factors: [] }

export function calculateRisk() {
  throw new Error('riskEngine.calculateRisk is not implemented yet.');
}
