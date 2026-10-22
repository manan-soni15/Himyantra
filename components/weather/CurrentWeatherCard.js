'use client';

import {
  CloudSun,
  Wind,
  Gauge,
  Eye,
  Thermometer,
  Activity,
} from 'lucide-react';

function formatValue(value, decimals = 1) {
  return value == null || !Number.isFinite(Number(value))
    ? '—'
    : Number(value).toFixed(decimals);
}

function badgeClass(level = 'Safe') {
  const value = String(level).toLowerCase();
  if (value === 'critical') return 'bg-red-500/10 text-red-300 border-red-500/30';
  if (value === 'high') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  if (value === 'moderate') return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
}

export default function CurrentWeatherCard({ weather, loading = false }) {
  if (loading && !weather) {
    return (
      <div className="rounded-lg border border-polar-border bg-polar-base/70 p-4 animate-pulse">
        <div className="h-4 w-40 rounded bg-white/10 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-12 rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="rounded-lg border border-polar-border bg-polar-base/70 p-4 text-xs text-gray-400">
        ECMWF IFS weather is unavailable for the active vessel position.
      </div>
    );
  }

  const severityBand = weather.severityBand || 'Safe';
  const current = weather.current || weather;

  return (
    <div className="rounded-lg border border-polar-border bg-polar-base/70 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <CloudSun className="h-4 w-4 text-polar-accent" />
            <span className="text-sm font-semibold text-white">ECMWF IFS Weather</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">
            IFS HRES · {weather.resolutionKm || 9} km · {weather.source || 'ECMWF via Open-Meteo'}
          </div>
        </div>
        <span className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase ${badgeClass(severityBand)}`}>
          {severityBand} · {current.severityIndex ?? '—'}/100
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded border border-polar-border bg-polar-raised/50">
          <div className="text-gray-500 flex items-center gap-1"><Wind className="h-3 w-3" /> Wind</div>
          <div className="font-mono text-white font-semibold mt-1">{formatValue(current.windSpeedKnots)} kt</div>
          <div className="text-[10px] text-gray-500 font-mono">{formatValue(current.windDirectionDegrees, 0)}° · gust {formatValue(current.windGustKnots)} kt</div>
        </div>
        <div className="p-2.5 rounded border border-polar-border bg-polar-raised/50">
          <div className="text-gray-500 flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature</div>
          <div className="font-mono text-white font-semibold mt-1">{formatValue(current.temperatureCelsius)}°C</div>
          <div className="text-[10px] text-gray-500 font-mono">MSL {formatValue(current.pressureHpa)} hPa</div>
        </div>
        <div className="p-2.5 rounded border border-polar-border bg-polar-raised/50">
          <div className="text-gray-500 flex items-center gap-1"><Eye className="h-3 w-3" /> Visibility</div>
          <div className="font-mono text-white font-semibold mt-1">{formatValue(current.visibilityKm)} km</div>
          <div className="text-[10px] text-gray-500 font-mono">Precip {formatValue(current.precipitationMm)} mm</div>
        </div>
        <div className="p-2.5 rounded border border-polar-border bg-polar-raised/50">
          <div className="text-gray-500 flex items-center gap-1"><Gauge className="h-3 w-3" /> Updated</div>
          <div className="font-mono text-white font-semibold mt-1 text-[11px]">
            {weather.updatedAt ? `${String(weather.updatedAt).split('T')[1]?.slice(0, 5) || '—'} UTC` : '—'}
          </div>
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Activity className="h-3 w-3" /> Current forecast hour</div>
        </div>
      </div>
    </div>
  );
}
