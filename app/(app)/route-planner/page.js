'use client';

import { useState } from 'react';
import { Sparkles, Map, Table2, BrainCircuit, ShieldAlert, CheckCircle2, Navigation, Anchor } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import Button from '@/components/Button';
import { TextField, SelectField } from '@/components/FormField';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { generateRoutes } from '@/lib/routeOptimizer';
import { useVessel } from '@/context/VesselContext';

const OBJECTIVES = ['Maximum Safety', 'Minimum Fuel', 'Minimum Time', 'Balanced'];

const COMPARISON_COLUMNS = [
  { key: 'route', label: 'Route Option' },
  { key: 'distance', label: 'Distance' },
  { key: 'risk', label: 'Risk Score' },
  { key: 'fuel', label: 'Fuel Est.' },
  { key: 'eta', label: 'Est. Duration' },
  { key: 'aiScore', label: 'AI Score' },
];

export default function RoutePlannerPage() {
  const { activeVessel, activeVesselId: selectedVesselId, setActiveVesselId: setSelectedVesselId, vessels } = useVessel();
  const [startPoint, setStartPoint] = useState('Ushuaia Port (-54.80°, -68.30°)');
  const [destinationPoint, setDestinationPoint] = useState('Palmer Station (-64.77°, -64.08°)');
  const [objective, setObjective] = useState('Balanced');
  const [generatedRoutes, setGeneratedRoutes] = useState(() => {
    return generateRoutes({
      vessel: activeVessel || vessels[0],
      objective: 'Balanced',
    });
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    const currentVessel = vessels.find((v) => v.id === selectedVesselId) || activeVessel;
    const results = generateRoutes({
      vessel: currentVessel,
      objective: objective,
    });
    setGeneratedRoutes(results);
  };

  const recommendedRoute = generatedRoutes.find((r) => r.isRecommended) || generatedRoutes[0];

  const tableRows = generatedRoutes.map((r) => ({
    route: (
      <div>
        <div className="font-semibold text-white flex items-center gap-1.5">
          {r.name}
          {r.isRecommended && (
            <span className="bg-polar-accent/20 text-polar-accent text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">RECOMMENDED</span>
          )}
        </div>
        <div className="text-[11px] text-gray-400">{r.description}</div>
      </div>
    ),
    distance: `${r.distanceNauticalMiles} NM`,
    risk: (
      <div className="flex items-center gap-2">
        <span className="font-mono text-white font-semibold">{r.avgRiskScore}/100</span>
        <StatusBadge status={r.riskBand === 'safe' ? 'Safe' : r.riskBand === 'moderate' ? 'Moderate' : r.riskBand === 'high' ? 'High' : 'Critical'} />
      </div>
    ),
    fuel: `${r.estimatedFuelTons} Tons`,
    eta: `${r.estimatedDays} Days`,
    aiScore: (
      <div className="flex items-center gap-1 font-mono font-bold text-polar-accent text-sm">
        <Sparkles className="h-3.5 w-3.5" />
        {r.aiScore}%
      </div>
    ),
  }));

  return (
    <div>
      <PageHeader
        title="Route Planner"
        description="AI spatial route optimization, risk profiling, and fuel-time tradeoff evaluator."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Route configuration */}
        <SectionCard title="Voyage Configuration" icon={Navigation} className="lg:col-span-1 h-fit">
          <form className="space-y-4" onSubmit={handleGenerate}>
            <SelectField
              id="vessel"
              label="Selected Vessel"
              options={vessels.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.iceClass} Class)`,
              }))}
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
            />
            <TextField
              id="start"
              label="Starting Coordinates"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
            />
            <TextField
              id="destination"
              label="Destination Point"
              value={destinationPoint}
              onChange={(e) => setDestinationPoint(e.target.value)}
            />
            <SelectField
              id="objective"
              label="Optimization Objective"
              options={OBJECTIVES.map((o) => ({ value: o, label: o }))}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
            <Button type="submit" className="w-full flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              EVALUATE & GENERATE ROUTES
            </Button>
          </form>

          {/* Active Vessel Spec Telemetry */}
          <div className="mt-4 p-3 bg-polar-base rounded border border-polar-border text-xs space-y-1.5">
            <div className="text-gray-400 font-semibold flex items-center gap-1.5">
              <Anchor className="h-3.5 w-3.5 text-polar-accent" />
              Active Vessel Capability Profile
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Hull IMO Class:</span>
              <span className="font-mono text-polar-accent font-semibold">{activeVessel.iceClass}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Cruising Speed:</span>
              <span className="font-mono text-white">{activeVessel.maxSpeedKnots} knots</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Max Bunker Fuel:</span>
              <span className="font-mono text-white">{activeVessel.fuelCapacityTons} Tons</span>
            </div>
          </div>
        </SectionCard>

        {/* Visualization + comparison */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Candidate Route Optimization Comparison" icon={Table2}>
            <DataTable columns={COMPARISON_COLUMNS} rows={tableRows} />
          </SectionCard>

          {/* Waypoint Path Overview */}
          <SectionCard title="Recommended Waypoint Sequence" icon={Map}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {recommendedRoute.waypoints.map((wp, i) => (
                <div key={i} className="p-3 bg-polar-base rounded border border-polar-border text-xs">
                  <div className="text-polar-accent font-mono font-bold mb-1">Waypoint {i + 1}</div>
                  <div className="font-semibold text-white mb-0.5">{wp.label}</div>
                  <div className="text-gray-400 font-mono text-[11px]">{wp.lat.toFixed(2)}°, {wp.lon.toFixed(2)}°</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* AI Recommendation Summary */}
          <SectionCard title="AI Strategic Recommendation" icon={BrainCircuit}>
            <div className="p-4 bg-polar-raised/60 rounded border border-polar-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="font-bold text-white text-sm">{recommendedRoute.name}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-polar-accent font-bold">
                  AI Fit Score: {recommendedRoute.aiScore}/100
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {recommendedRoute.description} Calculated for vessel hull <span className="text-polar-accent font-semibold">{activeVessel.name} ({activeVessel.iceClass})</span> matching objective <span className="text-white font-semibold">"{objective}"</span>.
              </p>
              
              <div className="pt-2 border-t border-polar-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Total Distance</span>
                  <span className="font-mono text-white font-semibold">{recommendedRoute.distanceNauticalMiles} NM</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Estimated Fuel</span>
                  <span className="font-mono text-white font-semibold">{recommendedRoute.estimatedFuelTons} Tons</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Estimated ETA</span>
                  <span className="font-mono text-white font-semibold">{recommendedRoute.estimatedDays} Days</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Risk Severity</span>
                  <span className="font-mono text-green-400 font-semibold">{recommendedRoute.avgRiskScore}/100 ({recommendedRoute.riskBand.toUpperCase()})</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
