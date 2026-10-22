import { NextResponse } from 'next/server';
import { fetchEcmwfWeather } from '@/lib/ecmwfWeather';
import { calculateWeatherSeverity, getWeatherSeverityBand } from '@/lib/weatherRisk';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  const forecastHours = Math.min(
    72,
    Math.max(12, Number(searchParams.get('forecastHours')) || 48)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { success: false, error: 'Valid lat and lon are required.' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchEcmwfWeather(lat, lon, { forecastHours });
    const severityIndex = calculateWeatherSeverity(data.current);

    const severityBand = getWeatherSeverityBand(severityIndex);

    return NextResponse.json({
      ...data,
      severityIndex,
      severityBand,
      current: {
        ...data.current,
        severityIndex,
        severityBand,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'ECMWF weather unavailable.',
      },
      { status: 503 }
    );
  }
}
