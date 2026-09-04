// lib/riskEngine.js
// Navigation Risk Engine for Antarctic Sea-Ice, Iceberg Proximity, and Environmental Hazards

/**
 * Calculates navigation risk score (0-100) and risk severity level for polar transit.
 * 
 * @param {Object} params
 * @param {number} params.seaIceConcentration - Sea-ice coverage percentage (0-100%)
 * @param {number} params.icebergProximityKm - Distance to nearest tracked iceberg in km
 * @param {number} params.weatherSeverityIndex - Combined weather index (0-100, wind/wave/vis)
 * @param {string} params.vesselIceClass - IMO Ice Class ('PC1' to 'PC7' or 'UNCLASSED')
 * 
 * @returns {Object} { score: number, level: 'safe' | 'moderate' | 'high' | 'critical', factors: Array }
 */
export function calculateRisk({
  seaIceConcentration = 50,
  icebergProximityKm = 25,
  weatherSeverityIndex = 40,
  vesselIceClass = 'PC5',
} = {}) {
  // 1. Sea-Ice Concentration Score (Weight: 35%)
  const seaIceScore = Math.min(100, Math.max(0, seaIceConcentration));

  // 2. Iceberg Proximity Score (Weight: 35%)
  // Exponential penalty for icebergs within 50km
  let icebergScore = 0;
  if (icebergProximityKm <= 5) {
    icebergScore = 100;
  } else if (icebergProximityKm <= 20) {
    icebergScore = 80 - (icebergProximityKm - 5) * 3;
  } else if (icebergProximityKm <= 60) {
    icebergScore = 35 - (icebergProximityKm - 20) * 0.75;
  } else {
    icebergScore = 5;
  }

  // 3. Environmental Weather Score (Weight: 30%)
  const weatherScore = Math.min(100, Math.max(0, weatherSeverityIndex));

  // Base raw risk calculation
  let rawRiskScore = (seaIceScore * 0.35) + (icebergScore * 0.35) + (weatherScore * 0.30);

  // 4. Vessel Ice-Class Mitigation Factor
  const iceClassBonusMap = {
    'PC1': 35, // Year-round in all polar waters
    'PC2': 30, // Year-round in multi-year ice
    'PC3': 25, // Year-round in second-year ice
    'PC4': 20, // Year-round in thick first-year ice
    'PC5': 15, // Year-round in medium first-year ice
    'PC6': 10, // Summer/autumn in medium first-year ice
    'PC7': 5,  // Summer/autumn in thin first-year ice
    'UNCLASSED': 0,
  };

  const mitigationBonus = iceClassBonusMap[vesselIceClass.toUpperCase()] || 10;
  const finalScore = Math.max(5, Math.min(99, Math.round(rawRiskScore - mitigationBonus * 0.4)));

  // Categorize risk band
  let level = 'safe';
  if (finalScore >= 75) {
    level = 'critical';
  } else if (finalScore >= 55) {
    level = 'high';
  } else if (finalScore >= 35) {
    level = 'moderate';
  } else {
    level = 'safe';
  }

  // Identify primary contributing risk factors
  const factors = [];
  if (seaIceConcentration > 70) {
    factors.push({ name: 'Heavy Sea-Ice Pack', severity: 'High', value: `${seaIceConcentration}%` });
  }
  if (icebergProximityKm < 15) {
    factors.push({ name: 'Iceberg Proximity Warning', severity: 'Critical', value: `${icebergProximityKm} km` });
  }
  if (weatherSeverityIndex > 60) {
    factors.push({ name: 'Severe Polar Gales', severity: 'High', value: `${weatherSeverityIndex}/100` });
  }
  if (mitigationBonus >= 20) {
    factors.push({ name: 'Icebreaker Class Protection', severity: 'Favorable', value: vesselIceClass });
  }

  return {
    score: finalScore,
    level, // 'safe' | 'moderate' | 'high' | 'critical'
    factors,
    breakdown: {
      seaIceImpact: Math.round(seaIceScore * 0.35),
      icebergImpact: Math.round(icebergScore * 0.35),
      weatherImpact: Math.round(weatherScore * 0.30),
      vesselMitigation: Math.round(mitigationBonus * 0.4),
    },
  };
}

export default calculateRisk;
