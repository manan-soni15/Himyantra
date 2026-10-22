import { NextResponse } from 'next/server';

import { sampleAMSR2SeaIce } from '@/lib/amsr2SeaIce';
import { calculateRisk } from '@/lib/riskEngine';
import { calculateSpatialRiskAtLatLon } from '@/lib/spatialRiskGrid';
import { seaIceGrid } from '@/data/seaIce';
import { fetchEcmwfWeather } from '@/lib/ecmwfWeather';
import { calculateWeatherSeverity, getWeatherSeverityBand } from '@/lib/weatherRisk';

function fallbackSeaIce(lat, lon) {
  let nearest = null;
  let minDistance = Infinity;

  for (const cell of seaIceGrid) {
    const dLat = cell.lat - lat;
    const dLon = cell.lon - lon;

    const distance =
      Math.sqrt(dLat * dLat + dLon * dLon);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = cell;
    }
  }

  return nearest
    ? {
        concentration: nearest.concentration,
        source: 'Prototype fallback grid',
        live: false,
      }
    : null;
}

export async function GET(request) {
  const { searchParams } =
    new URL(request.url);

  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));

  const iceClass =
    (searchParams.get('iceClass') ||
      'UNCLASSED').toUpperCase();

  const vesselId =
    searchParams.get('vesselId');

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: 'Valid lat and lon are required.',
      },
      { status: 400 }
    );
  }

  let seaIce;
  let ecmwfWeather = null;

  const [seaIceResult, weatherResult] = await Promise.allSettled([
    sampleAMSR2SeaIce(lat, lon),
    fetchEcmwfWeather(lat, lon, { forecastHours: 48 }),
  ]);

  if (seaIceResult.status === 'fulfilled') {
    seaIce = {
      ...seaIceResult.value,
      live: true,
    };
  } else {
    const fallback = fallbackSeaIce(lat, lon);

    if (!fallback) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not sample AMSR2 sea ice.',
        },
        { status: 503 }
      );
    }

    seaIce = {
      ...fallback,
      error:
        seaIceResult.reason instanceof Error
          ? seaIceResult.reason.message
          : 'AMSR2 sampling failed',
    };
  }

  if (weatherResult.status === 'fulfilled') {
    ecmwfWeather = weatherResult.value;
  }

  // Use the spatial grid for iceberg proximity and as the weather fallback.
  const spatial = calculateSpatialRiskAtLatLon(lat, lon);

  const icebergProximityKm =
    spatial?.metadata?.nearestIcebergDistanceKm ?? 500;

  const fallbackWeatherSeverity = spatial?.weatherRisk ?? 0;
  const weatherSeverityIndex = ecmwfWeather
    ? calculateWeatherSeverity(ecmwfWeather.current)
    : fallbackWeatherSeverity;

  const risk = calculateRisk({
    seaIceConcentration:
      seaIce.concentration,

    icebergProximityKm,

    weatherSeverityIndex,

    vesselIceClass: iceClass,
  });

  return NextResponse.json({
    success: true,

    vesselId,

    position: {
      lat,
      lon,
    },

    seaIce,

    iceberg: {
      nearestDistanceKm:
        icebergProximityKm,

      name:
        spatial?.metadata
          ?.nearestIcebergName ?? null,

      riskScore:
        spatial?.icebergRisk ?? 0,
    },

    weather: ecmwfWeather
      ? {
          live: true,
          source: ecmwfWeather.source,
          model: ecmwfWeather.model,
          resolutionKm: ecmwfWeather.resolutionKm,
          updatedAt: ecmwfWeather.updatedAt,
          severityIndex: weatherSeverityIndex,
          severityBand: getWeatherSeverityBand(weatherSeverityIndex),
          windSpeedKnots: ecmwfWeather.current.windSpeedKnots,
          windDirectionDegrees: ecmwfWeather.current.windDirectionDegrees,
          windGustKnots: ecmwfWeather.current.windGustKnots,
          temperatureCelsius: ecmwfWeather.current.temperatureCelsius,
          pressureHpa: ecmwfWeather.current.pressureHpa,
          visibilityKm: ecmwfWeather.current.visibilityKm,
          precipitationMm: ecmwfWeather.current.precipitationMm,
          forecast: ecmwfWeather.hourly,
        }
      : {
          live: false,
          source: 'Fallback spatial weather grid',
          model: null,
          resolutionKm: null,
          updatedAt: null,
          severityIndex: weatherSeverityIndex,
          severityBand: getWeatherSeverityBand(weatherSeverityIndex),
          windSpeedKnots: null,
          windDirectionDegrees: null,
          windGustKnots: null,
          temperatureCelsius: null,
          pressureHpa: null,
          visibilityKm: null,
          precipitationMm: null,
          forecast: null,
        },

    risk,
  });
}