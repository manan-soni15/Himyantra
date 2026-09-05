// data/weather.js
// Prototype Weather Data — ERA5/GFS-inspired values (static mock dataset)

import { normalizeWeather } from "../lib/dataNormalizer.js";

const rawCurrentWeather = {
  region: "Weddell Sea / Antarctic Sector",
  timestamp: "2026-08-27T00:00:00Z",
  windSpeedKnots: 28.5,
  windDirectionDegrees: 245, // WSW
  uWindMetersPerSec: -11.2, // West-East wind component
  vWindMetersPerSec: -5.4,   // South-North wind component
  airTempCelsius: -14.2,
  seaSurfaceTempCelsius: -1.8,
  mslPressureHpa: 984.5,
  visibilityNauticalMiles: 4.5,
  waveHeightMeters: 3.2,
  weatherCondition: "Blowing Snow / High Winds",
  severityIndex: 68, // 0-100
  source: "Prototype Weather Data — ERA5/GFS-inspired values",
};

export const currentWeather = normalizeWeather(rawCurrentWeather);

export const regionalWeatherGrid = [
  { region: "Drake Passage", windKts: 38, airTempC: -2.1, pressure: 990, waveMeters: 5.8, risk: "High" },
  { region: "Weddell Sea North", windKts: 28, airTempC: -14.2, pressure: 984, waveMeters: 3.2, risk: "Moderate" },
  { region: "Weddell Sea South", windKts: 22, airTempC: -24.0, pressure: 978, waveMeters: 1.5, risk: "Moderate" },
  { region: "Ross Sea Approach", windKts: 34, airTempC: -18.5, pressure: 982, waveMeters: 4.1, risk: "High" },
  { region: "Prydz Bay Sector", windKts: 18, airTempC: -16.0, pressure: 995, waveMeters: 2.0, risk: "Safe" },
  { region: "Bellingshausen Sea", windKts: 42, airTempC: -8.5, pressure: 972, waveMeters: 6.5, risk: "Critical" },
];

export const weather = currentWeather;
export default weather;
