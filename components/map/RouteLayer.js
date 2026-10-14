'use client';

import { Polyline, Tooltip } from 'react-leaflet';

export default function RouteLayer({ routes = [], visible = true }) {
  if (!visible || !routes || routes.length === 0) return null;

  const alternatives = routes.filter((route) => !route.isRecommended && !route.isInvalid);
  const recommended = routes.find((route) => route.isRecommended && !route.isInvalid);

  return (
    <>
      {alternatives.map((route) => (
        <RouteLine key={route.id} route={route} isRecommended={false} />
      ))}
      {recommended && (
        <RouteLine key={recommended.id} route={recommended} isRecommended />
      )}
    </>
  );
}

function getRiskColor(route) {
  if (route.isRecommended) return '#22d3ee';
  if (route.riskBand === 'critical') return '#ef4444';
  if (route.riskBand === 'high') return '#f97316';
  if (route.riskBand === 'moderate') return '#f59e0b';
  return '#64748b';
}

function RouteLine({ route, isRecommended }) {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const positions = route.waypoints.map((waypoint) => [waypoint.lat, waypoint.lon]);
  const color = getRiskColor(route);

  const pathOptions = isRecommended
    ? {
        color,
        weight: 5,
        opacity: 0.95,
      }
    : {
        color,
        weight: 2.5,
        opacity: 0.75,
        dashArray: '6, 10',
      };

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      <Tooltip direction="top" className="antarctic-tooltip">
        <div className="text-xs min-w-[190px]">
          <div className="font-bold flex items-center gap-1.5 mb-1 border-b border-gray-600 pb-1">
            {route.name}
            {isRecommended && <span className="text-cyan-400">(Recommended)</span>}
          </div>
          <div className="text-gray-300 mb-1">
            Strategy: {route.strategyLabel || route.strategyObjective}
          </div>
          <div>Dist: {route.distanceNauticalMiles} NM</div>
          <div>Time: {route.estimatedDays} Days</div>
          <div>Fuel: {route.estimatedFuelTons} Tons</div>
          <div className="mt-1 pt-1 border-t border-gray-600">
            <div>Risk: {route.routeRiskScore}/100 ({String(route.riskBand || '').toUpperCase()})</div>
            {route.spatialMetrics && (
              <>
                <div>Max Risk: {Math.round(route.spatialMetrics.maximumRisk)}</div>
                <div>Critical Exp: {Math.round(route.spatialMetrics.criticalRiskExposurePercent)}%</div>
              </>
            )}
          </div>
        </div>
      </Tooltip>
    </Polyline>
  );
}
