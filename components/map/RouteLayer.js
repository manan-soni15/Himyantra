'use client';

import { Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';

export default function RouteLayer({ routes = [], visible = true }) {
  if (!visible || !routes || routes.length === 0) return null;

  // Separate recommended from alternatives so recommended is drawn last (on top)
  const alternatives = routes.filter(r => !r.isRecommended);
  const recommended = routes.find(r => r.isRecommended);

  return (
    <>
      {/* Draw alternative routes first */}
      {alternatives.map(route => (
        <RouteLine key={route.id} route={route} isRecommended={false} />
      ))}
      
      {/* Draw recommended route on top */}
      {recommended && <RouteLine key={recommended.id} route={recommended} isRecommended={true} />}
    </>
  );
}

function RouteLine({ route, isRecommended }) {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const positions = route.waypoints.map(wp => [wp.lat, wp.lon]);

  const pathOptions = isRecommended
    ? { color: '#22d3ee', weight: 4, opacity: 0.9 } // Cyan/polar accent, solid, dominant
    : { color: '#94a3b8', weight: 2, opacity: 0.6, dashArray: '5, 10' }; // Slate, thin, dashed

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      <Tooltip direction="top" className="antarctic-tooltip">
        <div className="text-xs">
          <div className="font-bold flex items-center gap-1.5 mb-1 border-b border-gray-600 pb-1">
            {route.name}
            {isRecommended && <span className="text-cyan-400">(Recommended)</span>}
          </div>
          <div>Dist: {route.distanceNauticalMiles} NM</div>
          <div>Time: {route.estimatedDays} Days</div>
          <div>Fuel: {route.estimatedFuelTons} Tons</div>
          <div className="mt-1 pt-1 border-t border-gray-600">
            <div>Risk: {route.avgRiskScore}/100 ({route.riskBand.toUpperCase()})</div>
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
