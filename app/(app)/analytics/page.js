'use client';

import { Navigation, MapPin, Fuel, Droplet, Gauge, Clock, TrendingUp, ShieldAlert, Snowflake, GitCompare, CheckCircle2, Anchor } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { useVessel } from '@/context/VesselContext';
import { calculateRisk } from '@/lib/riskEngine';

// Vessel-specific voyage telemetry database for dynamic recalculation
const VESSEL_TELEMETRY_MAP = {
  'RV-POLARSTERN-II': {
    totalDistance: 2570,
    distanceTravelled: 2150,
    distanceRemaining: 420,
    fuelConsumedPct: 18,
    fuelRemainingPct: 82,
    localIceConcentration: 84.2,
    avgFuelBurnDay: 28.4,
    drakeBurn: 32.1,
    coastalBurn: 22.4,
    icebreakerBurn: 38.6,
    icebergDistKm: 8.4,
    hullStatus: 'Approved (PC1 Heavy Icebreaker)',
  },
  'RSV-NUYINA': {
    totalDistance: 2180,
    distanceTravelled: 1890,
    distanceRemaining: 290,
    fuelConsumedPct: 22,
    fuelRemainingPct: 78,
    localIceConcentration: 62.1,
    avgFuelBurnDay: 24.1,
    drakeBurn: 28.5,
    coastalBurn: 18.2,
    icebreakerBurn: 31.4,
    icebergDistKm: 12.1,
    hullStatus: 'Approved (PC2 Multi-Year Ice)',
  },
  'MV-POLAR-EXPLORER': {
    totalDistance: 1800,
    distanceTravelled: 1420,
    distanceRemaining: 380,
    fuelConsumedPct: 16,
    fuelRemainingPct: 84,
    localIceConcentration: 78.4,
    avgFuelBurnDay: 14.2,
    drakeBurn: 18.5,
    coastalBurn: 12.0,
    icebreakerBurn: 22.1,
    icebergDistKm: 14.75,
    hullStatus: 'Approved (PC3 Second-Year Ice)',
  },
  'RRS-SIR-DAVID-ATTENBOROUGH': {
    totalDistance: 1660,
    distanceTravelled: 1120,
    distanceRemaining: 540,
    fuelConsumedPct: 25,
    fuelRemainingPct: 75,
    localIceConcentration: 54.3,
    avgFuelBurnDay: 16.8,
    drakeBurn: 21.0,
    coastalBurn: 13.5,
    icebreakerBurn: 25.2,
    icebergDistKm: 19.8,
    hullStatus: 'Approved (PC4 Thick First-Year Ice)',
  },
  'MV-ANTARCTIC-NAVIGATOR': {
    totalDistance: 1600,
    distanceTravelled: 980,
    distanceRemaining: 620,
    fuelConsumedPct: 31,
    fuelRemainingPct: 69,
    localIceConcentration: 48.9,
    avgFuelBurnDay: 11.5,
    drakeBurn: 14.2,
    coastalBurn: 9.8,
    icebreakerBurn: 18.0,
    icebergDistKm: 22.4,
    hullStatus: 'Caution (PC5 Medium First-Year Ice)',
  },
  'SS-SOUTHERN-CROSS': {
    totalDistance: 1200,
    distanceTravelled: 340,
    distanceRemaining: 860,
    fuelConsumedPct: 12,
    fuelRemainingPct: 88,
    localIceConcentration: 22.4,
    avgFuelBurnDay: 8.4,
    drakeBurn: 11.2,
    coastalBurn: 6.5,
    icebreakerBurn: 14.0,
    icebergDistKm: 31.0,
    hullStatus: 'Warning (PC6 Summer Operation)',
  },
  'MV-ENDURANCE-TRADER': {
    totalDistance: 1560,
    distanceTravelled: 620,
    distanceRemaining: 940,
    fuelConsumedPct: 28,
    fuelRemainingPct: 72,
    localIceConcentration: 38.5,
    avgFuelBurnDay: 7.2,
    drakeBurn: 9.8,
    coastalBurn: 5.8,
    icebreakerBurn: 12.5,
    icebergDistKm: 18.2,
    hullStatus: 'Warning (PC7 Thin Ice Limit)',
  },
  'MV-POLAR-STAR': {
    totalDistance: 1600,
    distanceTravelled: 410,
    distanceRemaining: 1190,
    fuelConsumedPct: 15,
    fuelRemainingPct: 85,
    localIceConcentration: 78.4,
    avgFuelBurnDay: 6.8,
    drakeBurn: 9.2,
    coastalBurn: 5.2,
    icebreakerBurn: 11.8,
    icebergDistKm: 6.2,
    hullStatus: 'DANGER: UNCLASSED Hull Limit Exceeded',
  },
};

export default function AnalyticsPage() {
  const { activeVessel } = useVessel();

  // Retrieve active vessel specific telemetry or fallback default
  const telemetry = VESSEL_TELEMETRY_MAP[activeVessel.id] || VESSEL_TELEMETRY_MAP['MV-POLAR-EXPLORER'];

  const fuelCapacity = activeVessel.fuelCapacityTons || 2400;
  const fuelConsumedTons = Math.round((fuelCapacity * telemetry.fuelConsumedPct) / 100);
  const fuelRemainingTons = Math.round((fuelCapacity * telemetry.fuelRemainingPct) / 100);
  const speedKnots = activeVessel.maxSpeedKnots || 16.5;
  const etaDays = (telemetry.distanceRemaining / (speedKnots * 24)).toFixed(1);

  // Dynamic Risk Engine Score Calculation
  const riskResult = calculateRisk({
    seaIceConcentration: telemetry.localIceConcentration,
    icebergProximityKm: telemetry.icebergDistKm,
    weatherSeverityIndex: 42,
    vesselIceClass: activeVessel.iceClass,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voyage Analytics"
        description={`Simulated voyage metrics, fuel burn profiles, and risk telemetry dynamically synchronized for ${activeVessel.name}.`}
      />

      {/* Active Vessel Telemetry Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-polar-card border border-polar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-polar-accent/10 text-polar-accent border border-polar-accent/30">
            <Anchor className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{activeVessel.name}</h2>
              <span className="bg-polar-accent/20 text-polar-accent text-xs px-2 py-0.5 rounded font-mono font-bold">
                {activeVessel.iceClass} CLASS
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Destination: <span className="text-white font-medium">{activeVessel.destination || "Antarctic Outpost"}</span> • Type: <span className="text-gray-300">{activeVessel.type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-gray-400">Bunker Tank Cap:</div>
            <div className="text-white font-bold">{fuelCapacity.toLocaleString()} Tons</div>
          </div>
          <div className="h-8 w-px bg-polar-border" />
          <div className="text-right">
            <div className="text-gray-400">Cruising Speed:</div>
            <div className="text-polar-accent font-bold">{speedKnots} knots</div>
          </div>
        </div>
      </div>

      {/* Primary Telemetry KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Distance Travelled" value={telemetry.distanceTravelled.toLocaleString()} unit="nm" icon={Navigation} status="info" />
        <KpiCard label="Distance Remaining" value={telemetry.distanceRemaining.toLocaleString()} unit="nm" icon={MapPin} status="info" />
        <KpiCard label="Fuel Consumed" value={telemetry.fuelConsumedPct} unit="%" icon={Fuel} status="safe" hint={`${fuelConsumedTons} / ${fuelCapacity} Tons`} />
        <KpiCard label="Fuel Remaining" value={telemetry.fuelRemainingPct} unit="%" icon={Droplet} status="safe" hint={`${fuelRemainingTons} / ${fuelCapacity} Tons`} />
        <KpiCard label="Average Speed" value={speedKnots} unit="kn" icon={Gauge} status="info" />
        <KpiCard label="Estimated Arrival" value={`${etaDays} Days`} icon={Clock} status="safe" />
      </div>

      {/* Real Analytics & Trends Panels */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Fuel Consumption Trend */}
        <SectionCard title="Fuel Consumption vs Distance Profile" icon={TrendingUp}>
          <div className="p-4 rounded-lg bg-polar-base border border-polar-border space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-semibold">Bunker Fuel Efficiency</span>
              <span className="font-mono text-polar-accent font-bold">{telemetry.avgFuelBurnDay} Tons / Day</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Drake Passage Transit (Heavy Gales)</span>
                  <span className="font-mono text-white">{telemetry.drakeBurn} T/day</span>
                </div>
                <div className="w-full bg-polar-border h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.drakeBurn / 40) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Peninsula Coastal Cruise (Open Water)</span>
                  <span className="font-mono text-white">{telemetry.coastalBurn} T/day</span>
                </div>
                <div className="w-full bg-polar-border h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.coastalBurn / 40) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Icebreaker Escort Channel ({activeVessel.iceClass} Mode)</span>
                  <span className="font-mono text-white">{telemetry.icebreakerBurn} T/day</span>
                </div>
                <div className="w-full bg-polar-border h-2 rounded-full overflow-hidden">
                  <div className="bg-polar-accent h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.icebreakerBurn / 40) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Navigation Risk Dynamics */}
        <SectionCard title="Navigation Risk & Safety Telemetry" icon={ShieldAlert}>
          <div className="p-4 rounded-lg bg-polar-base border border-polar-border space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">Active Expedition Risk Score</span>
              <StatusBadge status={riskResult.level === 'safe' ? 'Safe' : riskResult.level === 'moderate' ? 'Moderate' : riskResult.level === 'high' ? 'High' : 'Critical'} label={`Risk: ${riskResult.score}/100 (${riskResult.level.toUpperCase()})`} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-polar-border text-[11px]">
              <div className="bg-polar-raised/60 p-2.5 rounded border border-polar-border">
                <span className="text-gray-400 block">Sea-Ice Concentration</span>
                <span className="font-mono text-white font-bold">{telemetry.localIceConcentration}%</span>
              </div>
              <div className="bg-polar-raised/60 p-2.5 rounded border border-polar-border">
                <span className="text-gray-400 block">Prototype / Simulated Forecast — ConvLSTM Integration Pending</span>
                <span className="font-mono text-green-400 font-bold">89.7% Conf</span>
              </div>
              <div className="bg-polar-raised/60 p-2.5 rounded border border-polar-border">
                <span className="text-gray-400 block">Iceberg Hazard Index</span>
                <span className="font-mono text-white font-bold">{telemetry.icebergDistKm} km Dist</span>
              </div>
              <div className="bg-polar-raised/60 p-2.5 rounded border border-polar-border">
                <span className="text-gray-400 block">Hull Clearance</span>
                <span className={`font-mono font-bold ${riskResult.level === 'safe' ? 'text-emerald-400' : riskResult.level === 'moderate' ? 'text-yellow-400' : 'text-rose-400'}`}>
                  {telemetry.hullStatus}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Sea-Ice Historical Trend */}
        <SectionCard title="Antarctic Sea-Ice Regional Trend" icon={Snowflake}>
          <div className="p-4 rounded-lg bg-polar-base border border-polar-border space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">NSIDC Passive Microwave CDR Grid</span>
              <span className="font-mono text-polar-accent font-semibold">EPSG:3031</span>
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/40">
                <span className="text-gray-300">Marguerite Bay</span>
                <span className="text-white font-bold">89.0% Ice</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/40">
                <span className="text-gray-300">Bellingshausen Sea</span>
                <span className="text-white font-bold">76.0% Ice</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/40">
                <span className="text-gray-300">Antarctic Peninsula</span>
                <span className="text-white font-bold">42.0% Ice</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Route Optimization Performance */}
        <SectionCard title="AI Spatial Route Optimization Impact" icon={GitCompare}>
          <div className="p-4 rounded-lg bg-polar-base border border-polar-border space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">AI Recommended Route Savings</span>
              <span className="font-mono text-green-400 font-bold">+94% Fit Score</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/60 border border-polar-border">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Fuel Saved
                </span>
                <span className="font-mono text-emerald-400 font-bold">{(telemetry.avgFuelBurnDay * 1.02).toFixed(1)} Tons</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/60 border border-polar-border">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Voyage Time Saved
                </span>
                <span className="font-mono text-emerald-400 font-bold">0.8 Days (19.2 Hours)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-polar-raised/60 border border-polar-border">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Iceberg Risk Mitigation
                </span>
                <span className="font-mono text-emerald-400 font-bold">-42% Danger Score</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
