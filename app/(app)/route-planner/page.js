'use client';

import { useState, useEffect } from 'react';
import { Map, Table2, BrainCircuit, ShieldAlert, CheckCircle2, Navigation, Anchor, Info, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { SelectField, TextField } from '@/components/FormField';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { generateRoutes } from '@/lib/routeOptimizer';
import { useVessel } from '@/context/VesselContext';
import { researchStations } from '@/data/researchStations';
import { latLonToXY } from '@/lib/coordinateUtils';
import { GRID_MIN_X, GRID_MAX_X, GRID_MIN_Y, GRID_MAX_Y } from '@/lib/spatialRiskGrid';
import dynamic from 'next/dynamic';

const AntarcticMap = dynamic(
  () => import("@/components/map/AntarcticMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-md border border-polar-borderLight bg-polar-raised/40 min-h-[30rem]">
        <p className="text-sm text-[#c3d3dd]">Loading Route Map...</p>
      </div>
    ),
  }
);

const OBJECTIVES = ['Balanced', 'Safest', 'Fuel-efficient', 'Fastest'];

const COMPARISON_COLUMNS = [
  { key: 'route', label: 'Route Option' },
  { key: 'metrics', label: 'Time / Dist' },
  { key: 'risk', label: 'Env Risk' },
  { key: 'fuel', label: 'Est Fuel' },
];

function validateCoordinates(lat, lon) {
  if (isNaN(lat) || lat < -90 || lat > 90) return { valid: false, error: 'Invalid Latitude' };
  if (isNaN(lon) || lon < -180 || lon > 180) return { valid: false, error: 'Invalid Longitude' };
  
  const projected = latLonToXY(lat, lon);
  if (!projected) return { valid: false, error: 'Projection Failed' };

  if (projected.x < GRID_MIN_X || projected.x >= GRID_MAX_X || projected.y < GRID_MIN_Y || projected.y >= GRID_MAX_Y) {
    return { valid: false, error: 'Coordinates outside operational grid' };
  }
  
  return { valid: true };
}

export default function RoutePlannerPage() {
  const { activeVessel, vessels } = useVessel();
  const [objective, setObjective] = useState('Balanced');

  // Start / End State
  const [startPoint, setStartPoint] = useState({ 
    lat: activeVessel?.currentPosition?.[0] || -54.80, 
    lon: activeVessel?.currentPosition?.[1] || -68.30, 
    source: 'vessel' 
  });
  const [endPoint, setEndPoint] = useState({ lat: -64.77, lon: -64.08, source: 'coordinates' });

  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Sync startPoint when activeVessel changes (if origin mode is 'vessel')
  useEffect(() => {
    if (startPoint.source === 'vessel' && activeVessel?.currentPosition) {
      setStartPoint({
        lat: activeVessel.currentPosition[0],
        lon: activeVessel.currentPosition[1],
        source: 'vessel'
      });
    }
  }, [activeVessel]);

  useEffect(() => {
    const startValid = validateCoordinates(startPoint.lat, startPoint.lon);
    const endValid = validateCoordinates(endPoint.lat, endPoint.lon);
    
    let isSubscribed = true;

    if (startValid.valid && endValid.valid) {
      setIsGenerating(true);
      
      generateRoutes({
        startPoint,
        endPoint,
        vessel: activeVessel || vessels[0],
        objective,
      }).then(results => {
        if (isSubscribed) {
          setGeneratedRoutes(results);
          setIsGenerating(false);
        }
      }).catch(err => {
        if (isSubscribed) {
          console.error(err);
          setGeneratedRoutes([{
            isInvalid: true,
            failureReason: "ERROR",
            routeRiskScore: 999
          }]);
          setIsGenerating(false);
        }
      });

    } else {
      setGeneratedRoutes([]);
    }

    return () => { isSubscribed = false; };
  }, [startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon, activeVessel, objective]);

  const handleObjectiveChange = (newObjective) => {
    setObjective(newObjective);
  };

  const handleStationSelect = (stationId, isStart) => {
    if (stationId === 'vessel' && isStart) {
      if (activeVessel?.currentPosition) {
        setStartPoint({ lat: activeVessel.currentPosition[0], lon: activeVessel.currentPosition[1], source: 'vessel' });
      }
      return;
    }
    const station = researchStations.find(s => s.id === stationId);
    if (station) {
      if (isStart) {
        setStartPoint({ lat: station.lat, lon: station.lon, source: station.id });
      } else {
        setEndPoint({ lat: station.lat, lon: station.lon, source: station.id });
      }
    } else if (stationId === 'coordinates') {
      if (isStart) setStartPoint(prev => ({...prev, source: 'coordinates'}));
      else setEndPoint(prev => ({...prev, source: 'coordinates'}));
    }
  };

  const handleCoordChange = (field, value, isStart) => {
    const num = parseFloat(value);
    if (isStart) {
      setStartPoint(prev => ({ ...prev, [field]: num, source: 'coordinates' }));
    } else {
      setEndPoint(prev => ({ ...prev, [field]: num, source: 'coordinates' }));
    }
  };

  const startValidation = validateCoordinates(startPoint.lat, startPoint.lon);
  const endValidation = validateCoordinates(endPoint.lat, endPoint.lon);

  const recommendedRoute = generatedRoutes.find((r) => r.isRecommended) || generatedRoutes[0];

  const tableRows = generatedRoutes.map((r) => ({
    route: (
      <div>
        <div className="font-semibold text-white flex items-center gap-1.5">
          {r.name}
          {r.isRecommended && (
            <span className="bg-polar-accent/20 text-polar-accent text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">REC</span>
          )}
        </div>
      </div>
    ),
    metrics: (
      <div className="text-xs text-gray-300">
        <div>{r.estimatedDays} d</div>
        <div className="text-gray-400">{r.distanceNauticalMiles} NM</div>
      </div>
    ),
    risk: (
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-white text-xs">{r.routeRiskScore}</span>
          <StatusBadge status={r.riskBand === 'safe' ? 'Safe' : r.riskBand === 'moderate' ? 'Moderate' : r.riskBand === 'high' ? 'High' : 'Critical'} />
        </div>
        {r.spatialMetrics && <span className="text-[9px] text-gray-400">Max: {Math.round(r.spatialMetrics.maximumRisk)}</span>}
      </div>
    ),
    fuel: <span className="text-xs font-mono">{r.estimatedFuelTons} T</span>,
  }));

  return (
    <div>
      <PageHeader
        title="Route Planner"
        description="Dynamic spatial route decision-support evaluated against current environmental risk grids."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT / MAIN: Map Visualization */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-lg flex items-start gap-3 text-amber-200">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
            <div className="text-sm">
              <strong className="block text-amber-400 mb-1">Phase 3 A* Routing Active</strong>
              Routes are generated asynchronously via Web Worker A* pathfinding over the 25km grid.
            </div>
          </div>

          <SectionCard title="Route Decision Map" icon={Map} className="flex flex-col h-full min-h-[30rem]">
             <div className="flex-1 w-full h-full relative" style={{ minHeight: '600px' }}>
                <AntarcticMap 
                  routes={generatedRoutes} 
                  startMarker={startValidation.valid ? startPoint : null}
                  endMarker={endValidation.valid ? endPoint : null}
                />
             </div>
          </SectionCard>
        </div>

        {/* RIGHT / SIDE PANEL: Metrics and Forms */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          <SectionCard title="Voyage Setup" icon={Navigation} className="h-fit">
            <div className="space-y-6">
              
              {/* Start Point */}
              <div className="space-y-3">
                <div className="font-semibold text-sm text-cyan-400 border-b border-polar-border pb-1">Origin</div>
                <SelectField
                  id="start-station"
                  label="Reference Station"
                  options={[
                    { value: 'vessel', label: 'Use Active Vessel' },
                    { value: 'coordinates', label: 'Custom Coordinates' },
                    ...researchStations.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  value={startPoint.source}
                  onChange={(e) => handleStationSelect(e.target.value, true)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    id="start-lat"
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    value={startPoint.lat}
                    onChange={(e) => handleCoordChange('lat', e.target.value, true)}
                  />
                  <TextField
                    id="start-lon"
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    value={startPoint.lon}
                    onChange={(e) => handleCoordChange('lon', e.target.value, true)}
                  />
                </div>
                {!startValidation.valid && (
                  <div className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {startValidation.error}</div>
                )}
              </div>

              {/* End Point */}
              <div className="space-y-3">
                <div className="font-semibold text-sm text-cyan-400 border-b border-polar-border pb-1">Destination</div>
                <SelectField
                  id="end-station"
                  label="Reference Station"
                  options={[
                    { value: 'coordinates', label: 'Custom Coordinates' },
                    ...researchStations.map(s => ({ value: s.id, label: s.name }))
                  ]}
                  value={endPoint.source}
                  onChange={(e) => handleStationSelect(e.target.value, false)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    id="end-lat"
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    value={endPoint.lat}
                    onChange={(e) => handleCoordChange('lat', e.target.value, false)}
                  />
                  <TextField
                    id="end-lon"
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    value={endPoint.lon}
                    onChange={(e) => handleCoordChange('lon', e.target.value, false)}
                  />
                </div>
                {!endValidation.valid && (
                  <div className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {endValidation.error}</div>
                )}
              </div>

              <SelectField
                id="objective"
                label="Primary Objective"
                options={OBJECTIVES.map((o) => ({ value: o, label: o }))}
                value={objective}
                onChange={(e) => handleObjectiveChange(e.target.value)}
              />
              
              <div className="p-3 bg-polar-base rounded border border-polar-border text-xs space-y-1.5">
                <div className="text-gray-400 font-semibold flex items-center gap-1.5">
                  <Anchor className="h-3.5 w-3.5 text-polar-accent" />
                  Active Vessel: {activeVessel?.name || 'None'}
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Cruising Speed:</span>
                  <span className="font-mono text-white">{activeVessel?.maxSpeedKnots || activeVessel?.speedKnots || 0} kts</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Recommendation summary */}
          {isGenerating ? (
            <SectionCard title="Strategic Recommendation" icon={BrainCircuit}>
              <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polar-accent mb-4"></div>
                <p>Calculating optimal A* route...</p>
              </div>
            </SectionCard>
          ) : recommendedRoute && !recommendedRoute.isInvalid ? (
             <SectionCard title="Strategic Recommendation" icon={BrainCircuit}>
               <div className="p-4 bg-polar-raised/60 rounded border border-polar-border space-y-3">
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="h-5 w-5 text-green-400" />
                   <span className="font-bold text-white text-sm">{recommendedRoute.name}</span>
                 </div>
                 <p className="text-xs text-gray-300 leading-relaxed">
                   {recommendedRoute.recommendationExplanation}
                 </p>
                 
                 <div className="pt-2 border-t border-polar-border grid grid-cols-2 gap-2 text-xs">
                   <div>
                     <span className="text-gray-400 block text-[10px]">Distance</span>
                     <span className="font-mono text-white font-semibold">{recommendedRoute.distanceNauticalMiles} NM</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[10px]">Est. Fuel</span>
                     <span className="font-mono text-white font-semibold">{recommendedRoute.estimatedFuelTons} Tons</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[10px]">Est. ETA</span>
                     <span className="font-mono text-white font-semibold">{recommendedRoute.estimatedDays} Days</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[10px]">Route Risk</span>
                     <span className="font-mono text-green-400 font-semibold">{recommendedRoute.routeRiskScore}/100</span>
                   </div>
                 </div>

                 {recommendedRoute.spatialMetrics && (
                   <div className="pt-2 border-t border-polar-border text-xs text-gray-300">
                     <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                       <ShieldAlert className="w-3.5 h-3.5" /> 
                       <strong>Hazard Summary</strong>
                     </div>
                     <div className="ml-5">
                       <div>• Max Encounter Risk: {Math.round(recommendedRoute.spatialMetrics.maximumRisk)}/100</div>
                       <div>• Critical Zone Exposure: {Math.round(recommendedRoute.spatialMetrics.criticalRiskExposurePercent)}%</div>
                       <div>• Data Completeness: {Math.round(recommendedRoute.spatialMetrics.routeDataCompleteness * 100)}%</div>
                     </div>
                   </div>
                 )}
               </div>
             </SectionCard>
          ) : (
            <SectionCard title="Recommendation" icon={ShieldAlert}>
              <div className="p-4 bg-red-950/40 rounded border border-red-900/50 text-red-200 text-sm">
                {recommendedRoute?.failureReason === 'NO_ROUTE' ? "No valid route found under the selected objective. Try adjusting endpoints or objectives." 
                 : recommendedRoute?.failureReason === 'START_BLOCKED' ? "Start location is inside a restricted environmental cell or on land."
                 : recommendedRoute?.failureReason === 'DESTINATION_BLOCKED' ? "Destination is inside a restricted environmental cell or on land."
                 : recommendedRoute?.failureReason === 'INVALID_VESSEL_SPEED' ? "Fastest/Balanced route unavailable: valid vessel speed is required."
                 : recommendedRoute?.failureReason === 'START_INVALID' ? "Start location is outside the operational routing area."
                 : recommendedRoute?.failureReason === 'DESTINATION_INVALID' ? "Destination is outside the operational routing area."
                 : recommendedRoute?.failureReason === 'VALIDATION_ERROR' ? "Generated route was rejected during final validation (crossed non-navigable cell)."
                 : recommendedRoute?.failureReason === 'START_ON_LAND' ? "Start coordinates map directly to land."
                 : recommendedRoute?.failureReason === 'DESTINATION_ON_LAND' ? "Destination coordinates map directly to land."
                 : `Routing failed (${recommendedRoute?.failureReason || 'UNKNOWN'})`}
              </div>
            </SectionCard>
          )}

          {/* Comparison */}
          {generatedRoutes.length > 0 && (
             <SectionCard title="Route Comparison" icon={Table2}>
               <div className="overflow-x-auto">
                 <DataTable columns={COMPARISON_COLUMNS} rows={tableRows} />
               </div>
             </SectionCard>
          )}

        </div>
      </div>
    </div>
  );
}
