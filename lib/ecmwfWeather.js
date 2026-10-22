const ECMWF_ENDPOINT = 'https://api.open-meteo.com/v1/ecmwf';

const HOURLY_VARIABLES = [
  'temperature_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'visibility',
  'precipitation',
  'weather_code',
].join(',');

function buildUrl(lat, lon, forecastHours, cellSelection = 'sea', hourly = HOURLY_VARIABLES) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly,
    forecast_hours: String(forecastHours),
    timezone: 'UTC',
    wind_speed_unit: 'kn',
    cell_selection: cellSelection,
  });

  return `${ECMWF_ENDPOINT}?${params.toString()}`;
}

function nearestHourlyIndex(times = []) {
  if (!times.length) return -1;

  const now = Date.now();
  let bestIndex = -1;
  let bestDelta = Infinity;

  times.forEach((value, index) => {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return;

    const delta = Math.abs(timestamp - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function readHourly(hourly, key, index, fallback = null) {
  const value = hourly?.[key]?.[index];
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function readNearestPositive(hourly, key, index, maxOffset = 12) {
  const values = Array.isArray(hourly?.[key]) ? hourly[key] : [];
  if (!values.length || index < 0) return null;

  const limit = Math.min(maxOffset, values.length - 1);
  for (let offset = 0; offset <= limit; offset += 1) {
    const candidates = offset === 0 ? [index] : [index - offset, index + offset];

    for (const candidate of candidates) {
      if (candidate < 0 || candidate >= values.length) continue;
      const numeric = Number(values[candidate]);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    }
  }

  return null;
}

function parseVisibilityKm(hourly, index) {
  const directMeters = readHourly(hourly, 'visibility', index);
  if (directMeters != null && directMeters > 0) {
    return Number((directMeters / 1000).toFixed(1));
  }

  const nearbyMeters = readNearestPositive(hourly, 'visibility', index, 12);
  return nearbyMeters == null ? null : Number((nearbyMeters / 1000).toFixed(1));
}

function buildCurrent(payload, visibilityOverride = null, visibilitySelection = 'sea') {
  const hourly = payload?.hourly || {};
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const currentIndex = nearestHourlyIndex(times);

  if (currentIndex < 0) {
    throw new Error('ECMWF response did not contain hourly forecast times.');
  }

  const seaVisibilityKm = parseVisibilityKm(hourly, currentIndex);

  return {
    time: times[currentIndex],
    temperatureCelsius: readHourly(hourly, 'temperature_2m', currentIndex),
    windSpeedKnots: readHourly(hourly, 'wind_speed_10m', currentIndex),
    windDirectionDegrees: readHourly(hourly, 'wind_direction_10m', currentIndex),
    windGustKnots: readHourly(hourly, 'wind_gusts_10m', currentIndex),
    pressureHpa: readHourly(hourly, 'pressure_msl', currentIndex),
    visibilityKm: visibilityOverride ?? seaVisibilityKm,
    visibilitySource: visibilityOverride != null && seaVisibilityKm == null
      ? visibilitySelection
      : 'sea',
    precipitationMm: readHourly(hourly, 'precipitation', currentIndex),
    weatherCode: readHourly(hourly, 'weather_code', currentIndex),
  };
}

async function fetchJson(url, signal) {
  const response = await fetch(url, {
    signal,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`ECMWF weather request failed (${response.status}).`);
  }

  return response.json();
}

async function fetchGenericEcmwfVisibility(lat, lon, forecastHours, signal) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'visibility',
    forecast_hours: String(forecastHours),
    timezone: 'UTC',
    models: 'ecmwf_ifs',
    cell_selection: 'sea',
  });

  const payload = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    signal
  );

  const hourly = payload?.hourly || {};
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const index = nearestHourlyIndex(times);
  if (index < 0) return null;

  const meters = readHourly(hourly, 'visibility', index);
  if (meters != null && meters > 0) {
    return Number((meters / 1000).toFixed(1));
  }

  const nearbyMeters = readNearestPositive(hourly, 'visibility', index, 24);
  return nearbyMeters == null ? null : Number((nearbyMeters / 1000).toFixed(1));
}

async function fetchNearestCellVisibility(lat, lon, forecastHours, signal) {
  const payload = await fetchJson(
    buildUrl(lat, lon, forecastHours, 'nearest', 'visibility'),
    signal
  );

  const hourly = payload?.hourly || {};
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const index = nearestHourlyIndex(times);
  if (index < 0) return null;

  const meters = readHourly(hourly, 'visibility', index);
  if (meters != null && meters > 0) {
    return Number((meters / 1000).toFixed(1));
  }

  const nearbyMeters = readNearestPositive(hourly, 'visibility', index, 12);
  return nearbyMeters == null ? null : Number((nearbyMeters / 1000).toFixed(1));
}

export function normalizeEcmwfResponse(payload, options = {}) {
  const current = buildCurrent(
    payload,
    options.visibilityOverride ?? null,
    options.visibilitySelection ?? 'sea'
  );

  return {
    success: true,
    source: 'ECMWF IFS HRES',
    model: 'IFS HRES',
    resolutionKm: 9,
    attribution: 'ECMWF via Open-Meteo',
    latitude: payload.latitude,
    longitude: payload.longitude,
    timezone: payload.timezone || 'UTC',
    updatedAt: current.time,
    current,
    hourly: payload.hourly || {},
  };
}

export async function fetchEcmwfWeather(
  lat,
  lon,
  { forecastHours = 48, signal } = {}
) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Valid latitude and longitude are required.');
  }

  const primaryPayload = await fetchJson(
    buildUrl(lat, lon, forecastHours, 'sea'),
    signal
  );

  const primary = normalizeEcmwfResponse(primaryPayload);

  if (primary.current.visibilityKm == null) {
    try {
      const fallbackVisibilityKm = await fetchGenericEcmwfVisibility(
        lat,
        lon,
        forecastHours,
        signal
      );

      if (fallbackVisibilityKm != null) {
        return normalizeEcmwfResponse(primaryPayload, {
          visibilityOverride: fallbackVisibilityKm,
          visibilitySelection: 'ecmwf_ifs_generic',
        });
      }
    } catch (error) {
      console.warn('ECMWF generic-model visibility fallback failed:', error);
    }

    try {
      const nearestVisibilityKm = await fetchNearestCellVisibility(
        lat,
        lon,
        forecastHours,
        signal
      );

      if (nearestVisibilityKm != null) {
        return normalizeEcmwfResponse(primaryPayload, {
          visibilityOverride: nearestVisibilityKm,
          visibilitySelection: 'nearest',
        });
      }
    } catch (error) {
      console.warn('ECMWF nearest-cell visibility fallback failed:', error);
    }
  }

  return primary;
}

export default fetchEcmwfWeather;

