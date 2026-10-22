function clamp(value) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

/**
 * Prototype navigation-weather severity model for HIMYANTRA.
 * Accepts normalized ECMWF fields from lib/ecmwfWeather.js.
 * This is not an official IMO/ECMWF safety standard.
 */
export function calculateWeatherSeverity({
  windKnots,
  windSpeedKnots,
  gustKnots,
  windGustKnots,
  visibilityKm = 999,
  pressureHpa = 1013,
  precipitationMm = 0,
} = {}) {
  const wind = Number.isFinite(Number(windSpeedKnots))
    ? Number(windSpeedKnots)
    : Number(windKnots) || 0;
  const gust = Number.isFinite(Number(windGustKnots))
    ? Number(windGustKnots)
    : Number(gustKnots) || 0;

  let score = 0;

  if (wind >= 35) score += 40;
  else if (wind >= 25) score += 30;
  else if (wind >= 18) score += 18;
  else if (wind >= 12) score += 8;

  if (gust >= 45) score += 20;
  else if (gust >= 35) score += 12;
  else if (gust >= 25) score += 6;

  if (visibilityKm < 2) score += 25;
  else if (visibilityKm < 5) score += 15;
  else if (visibilityKm < 10) score += 5;

  if (precipitationMm >= 5) score += 10;
  else if (precipitationMm >= 2) score += 5;

  if (pressureHpa < 970) score += 10;
  else if (pressureHpa < 985) score += 5;

  return Math.round(clamp(score));
}

export function getWeatherSeverityBand(score) {
  const value = clamp(score);
  if (value >= 75) return 'Critical';
  if (value >= 55) return 'High';
  if (value >= 35) return 'Moderate';
  return 'Safe';
}

export default calculateWeatherSeverity;
