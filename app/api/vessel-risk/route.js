import { NextResponse } from 'next/server';

import { sampleAMSR2SeaIce } from '@/lib/amsr2SeaIce';
import { calculateRisk } from '@/lib/riskEngine';
import { calculateSpatialRiskAtLatLon } from '@/lib/spatialRiskGrid';
import { seaIceGrid } from '@/data/seaIce';

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

  try {
    seaIce = {
      ...(await sampleAMSR2SeaIce(lat, lon)),
      live: true,
    };
  } catch (error) {
    const fallback =
      fallbackSeaIce(lat, lon);

    if (!fallback) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not sample AMSR2 sea ice.',
        },
        { status: 503 }
      );
    }

    seaIce = {
      ...fallback,
      error:
        error instanceof Error
          ? error.message
          : 'AMSR2 sampling failed',
    };
  }

  // Use current project iceberg/weather logic.
  // Do NOT use its sea-ice component.
  const spatial =
    calculateSpatialRiskAtLatLon(lat, lon);

  const icebergProximityKm =
    spatial?.metadata
      ?.nearestIcebergDistanceKm ?? 500;

  const weatherSeverityIndex =
    spatial?.weatherRisk ?? 0;

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

    weather: {
      severityIndex:
        weatherSeverityIndex,
    },

    risk,
  });
}