// lib/routeOptimizer.js
// AI-Assisted Route Optimization and Objective Ranking Engine

import { calculateRisk } from './riskEngine';
import { candidateRoutes } from '../data/routes';

/**
 * Generates and ranks optimal polar navigation routes based on vessel parameters and selected objective.
 * 
 * @param {Object} params
 * @param {Object} params.vessel - Active vessel object (iceClass, maxSpeedKnots, fuelCapacityTons)
 * @param {Array} params.start - Starting coordinates [lat, lon]
 * @param {Array} params.destination - Target coordinates [lat, lon]
 * @param {string} params.objective - Selected objective ('Maximum Safety' | 'Minimum Fuel' | 'Minimum Time' | 'Balanced')
 * 
 * @returns {Array} List of evaluated and scored route options
 */
export function generateRoutes({
  vessel = { iceClass: 'PC3', maxSpeedKnots: 16.5 },
  start = [-54.80, -68.30],
  destination = [-64.77, -64.08],
  objective = 'Balanced',
} = {}) {
  // Process candidate routes through risk engine & AI scorer
  const evaluatedRoutes = candidateRoutes.map((route) => {
    // Determine risk parameters per route candidate
    let seaIceConc = 45;
    let bergDist = 30;
    let weatherIndex = 35;

    if (route.objective === 'Maximum Safety') {
      seaIceConc = 25;
      bergDist = 65;
      weatherIndex = 28;
    } else if (route.objective === 'Minimum Time') {
      seaIceConc = 78;
      bergDist = 12;
      weatherIndex = 58;
    } else if (route.objective === 'Minimum Fuel') {
      seaIceConc = 50;
      bergDist = 35;
      weatherIndex = 32;
    }

    const riskEval = calculateRisk({
      seaIceConcentration: seaIceConc,
      icebergProximityKm: bergDist,
      weatherSeverityIndex: weatherIndex,
      vesselIceClass: vessel.iceClass || 'PC3',
    });

    // Compute ETA days based on distance & average speed
    const avgSpeed = (vessel.maxSpeedKnots || 15) * (1 - (riskEval.score / 250));
    const etaDays = Number((route.distanceNauticalMiles / (avgSpeed * 24)).toFixed(1));

    // Calculate AI Suitability Score (0-100) based on target objective fit
    let aiScore = 85;
    if (objective === 'Maximum Safety') {
      aiScore = 100 - (riskEval.score * 0.8);
    } else if (objective === 'Minimum Time') {
      aiScore = 100 - (etaDays * 12) - (riskEval.score * 0.3);
    } else if (objective === 'Minimum Fuel') {
      aiScore = 100 - (route.estimatedFuelTons * 0.5) - (riskEval.score * 0.2);
    } else { // Balanced
      aiScore = 100 - (riskEval.score * 0.4) - (etaDays * 5) - (route.estimatedFuelTons * 0.2);
    }

    return {
      ...route,
      avgRiskScore: riskEval.score,
      riskBand: riskEval.level,
      riskFactors: riskEval.factors,
      estimatedDays: etaDays,
      aiScore: Math.max(50, Math.min(99, Math.round(aiScore))),
      isRecommended: false,
    };
  });

  // Sort routes by AI Score descending
  evaluatedRoutes.sort((a, b) => b.aiScore - a.aiScore);

  if (evaluatedRoutes.length > 0) {
    evaluatedRoutes[0].isRecommended = true;
  }

  return evaluatedRoutes;
}

export default generateRoutes;
