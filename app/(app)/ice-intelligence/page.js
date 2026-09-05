'use client';

import { useState } from 'react';
import { Snowflake, Gauge, LineChart, Route, TableIcon, Compass, Navigation, Ship, ShieldCheck, AlertTriangle, Info, ChevronDown, MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import KpiCard from '@/components/KpiCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import SeaIceForecastChart from '@/components/ice/SeaIceForecastChart';
import { seaIceSummary, getVesselIceTelemetry } from '@/data/seaIce';
import { icebergs } from '@/data/icebergs';
import { calculateRisk } from '@/lib/riskEngine';
import { predictTrajectory } from '@/lib/trajectoryPrediction';
import { useVessel } from '@/context/VesselContext';

// Ice Class Safe Sea-Ice Concentration Limits
const ICE_CLASS_LIMITS = {
  PC1: 95, // All polar waters year-round
  PC2: 90, // Multi-year ice
  PC3: 85, // Second-year ice
  PC4: 75, // Thick first-year ice
  PC5: 65, // Medium first-year ice
  PC6: 45, // Thin first-year ice / summer-autumn
  PC7: 30, // Thin first-year ice without heavy pressure
  UNCLASSED: 15, // Open water only / non-ice-strengthened
};

const ICEBERG_COLUMNS = [
  { key: 'idDisplay', label: 'Iceberg ID' },
  { key: 'position', label: 'Position (Lat/Lon)' },
  { key: 'area', label: 'Area (sq km)' },
  { key: 'speed', label: 'Drift Speed' },
  { key: 'direction', label: 'Heading' },
  { key: 'vesselRisk', label: 'Vessel Threat Level' },
];

export default function IceIntelligencePage() {
  const { activeVessel: selectedVessel, activeVesselId: selectedVesselId, setActiveVesselId: setSelectedVesselId, vessels } = useVessel();
  const [selectedIcebergId, setSelectedIcebergId] = useState(icebergs[0].id);

  // Position-Based Telemetry for active vessel
  const activeTelemetry = getVesselIceTelemetry(selectedVessel);
  const vesselMaxIceLimit = ICE_CLASS_LIMITS[selectedVessel.iceClass] || 50;

  // Calculate Navigation Risk Score dynamically for selected vessel at its specific coordinates
  const navRisk = calculateRisk({
    seaIceConcentration: activeTelemetry.currentConcentration,
    icebergProximityKm: 14.75, // Nearest tracked giant iceberg distance
    weatherSeverityIndex: 42,
    vesselIceClass: selectedVessel.iceClass,
  });

  // Filter 5-Day Outlook Trend tailored to vessel location
  const forecast5DayTrend = activeTelemetry.forecast5DayTrend;

  // Compute iceberg risk customized for selected vessel
  const processedIcebergs = icebergs.slice(0, 8).map((berg) => {
    const trajectory = predictTrajectory(berg, 7);

    // Vessel class multiplier for iceberg threat level
    let riskLevel = 'Safe';
    const basePenalty = selectedVessel.iceClass === 'PC6' ? 1.4 : selectedVessel.iceClass === 'PC5' ? 1.2 : selectedVessel.iceClass === 'UNCLASSED' ? 1.8 : 1.0;
    const effectiveArea = berg.area * basePenalty;
    const effectiveSpeed = trajectory.speedKmPerDay * basePenalty;

    if (effectiveArea > 1000 || effectiveSpeed > 12) {
      riskLevel = 'Critical';
    } else if (effectiveArea > 300 || effectiveSpeed > 8) {
      riskLevel = 'High';
    } else if (effectiveArea > 100 || effectiveSpeed > 5) {
      riskLevel = 'Moderate';
    }

    const isSelected = berg.id === selectedIcebergId;

    return {
      rawId: berg.id,
      id: berg.id,
      idDisplay: (
        <div className="flex items-center gap-2">
          <span className={`font-mono font-semibold ${isSelected ? 'text-polar-accent' : 'text-white'}`}>
            {berg.id}
          </span>
          {isSelected && <span className="text-[10px] bg-polar-accent/20 text-polar-accent px-1.5 py-0.5 rounded font-sans">Active</span>}
        </div>
      ),
      position: `${berg.position[0].toFixed(2)}°, ${berg.position[1].toFixed(2)}°`,
      area: `${berg.area.toLocaleString()} km²`,
      speed: `${trajectory.speedKmPerDay} km/day`,
      direction: `${trajectory.directionDegrees}° (${getCompassDirection(trajectory.directionDegrees)})`,
      vesselRisk: <StatusBadge status={riskLevel} />,
      rawTrajectory: trajectory,
    };
  });

  // Currently selected iceberg object & trajectory
  const activeBerg = icebergs.find((b) => b.id === selectedIcebergId) || icebergs[0];
  const activeTrajectory = predictTrajectory(activeBerg, 7);

  // Hull clearance calculation
  const isIceExceeded = activeTelemetry.currentConcentration > vesselMaxIceLimit;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ice Intelligence"
        description="NOAA/NSIDC sea-ice concentration forecasts, dynamic vessel hull clearance, and Statistical / Linear Drift Prediction tracking."
      />

      {/* Interactive Vessel Selector & Operational Clearance Header */}
      <SectionCard title="Simulated Vessel Telemetry & Hull Risk Assessment" icon={Ship}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-polar-raised/70 border border-polar-border">
          {/* Vessel Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-polar-light flex items-center gap-1.5">
              <Ship className="h-4 w-4 text-polar-accent" />
              Select Operating Vessel:
            </label>
            <div className="relative inline-block w-full min-w-[300px]">
              <select
                value={selectedVesselId}
                onChange={(e) => setSelectedVesselId(e.target.value)}
                className="w-full appearance-none bg-[#0b131e] text-white border border-polar-borderLight hover:border-polar-accent rounded-lg px-3.5 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:border-polar-accent cursor-pointer transition-all shadow-sm"
              >
                {vessels.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0b131e] text-white py-2">
                    {v.name} ({v.iceClass})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-polar-accent absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="text-[11px] text-gray-400 font-mono pt-0.5 flex flex-wrap items-center gap-x-2">
              <span className="flex items-center gap-1 text-polar-accent font-semibold">
                <MapPin className="h-3 w-3" /> {activeTelemetry.regionName || 'Antarctic Sector'} ({selectedVessel.currentPosition[0]}°, {selectedVessel.currentPosition[1]}°)
              </span>
              <span>• Callsign: <strong className="text-gray-200">{selectedVessel.callsign}</strong></span>
              <span>• IMO Ice Class: <strong className="text-polar-accent">{selectedVessel.iceClass}</strong></span>
            </div>
          </div>

          {/* Dynamic Vessel Risk Badge & Clearance Status */}
          <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-l border-polar-border pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-gray-400">Navigation Risk Rating</div>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={navRisk.level} />
                <span className="font-mono text-sm font-bold text-white">Score: {navRisk.score}/100</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400">Hull Safe Ice Threshold</div>
              <div className="font-mono text-sm font-semibold text-white mt-1">
                Max {vesselMaxIceLimit}% Ice
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded bg-polar-base border border-polar-border">
              {isIceExceeded ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-amber-400">OPERATIONAL WARNING</div>
                    <div className="text-[10px] text-gray-300">Ice ({activeTelemetry.currentConcentration}%) exceeds {selectedVessel.iceClass} limit ({vesselMaxIceLimit}%)</div>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400">HULL CLEARANCE APPROVED</div>
                    <div className="text-[10px] text-gray-300">Concentration ({activeTelemetry.currentConcentration}%) within {selectedVessel.iceClass} range</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Sea-Ice Concentration Telemetry KPIs */}
      <section>
        <h3 className="font-display text-sm text-white mb-3 flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-polar-accent" />
          Local Sea-Ice Concentration Data — {activeTelemetry.regionName} (NSIDC CDR 25km Grid)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Current Concentration" value={activeTelemetry.currentConcentration} unit="%" icon={Snowflake} />
          <KpiCard label="24h Forecast" value={activeTelemetry.forecast24h} unit="%" icon={Snowflake} />
          <KpiCard label="48h Forecast" value={activeTelemetry.forecast48h} unit="%" icon={Snowflake} />
          <KpiCard label="Prediction Confidence" value={activeTelemetry.predictionConfidence} unit="%" icon={Gauge} />
        </div>

        {/* Recharts Sea-Ice Concentration Forecast Chart */}
        <SectionCard
          title="Satellite AMSR2 Sea-Ice Concentration Trend & Confidence Range"
          icon={LineChart}
          className="mt-4"
        >
          <div className="h-[420px] w-full overflow-hidden rounded-md border border-polar-borderLight bg-polar-raised/40 p-2">
            <SeaIceForecastChart />
          </div>
        </SectionCard>

        {/* 5-Day Outlook Trend */}
        <SectionCard title={`5-Day Sea-Ice Forecast Trend at ${activeTelemetry.regionName} (${selectedVessel.name} Limit: ${vesselMaxIceLimit}%)`} icon={LineChart} className="mt-4">
          <div className="rounded-md border border-polar-borderLight bg-polar-raised/40 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-center">
              {forecast5DayTrend.map((ts, idx) => {
                const exceedsLimit = ts.concentration > vesselMaxIceLimit;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-all ${
                      exceedsLimit
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-polar-base/60 border-polar-border'
                    }`}
                  >
                    <div className="text-[11px] text-gray-300 font-mono font-medium">{ts.day}</div>
                    <div className="text-lg font-bold text-white mt-1">{ts.concentration}%</div>
                    <div className="text-[10px] text-polar-accent font-mono mt-0.5">{ts.confidence}% conf</div>
                    <div className="mt-2 pt-2 border-t border-polar-border/50">
                      {exceedsLimit ? (
                        <span className="inline-block text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          Exceeds Limit
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Safe Range
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 font-mono pt-2 border-t border-polar-border/50">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-polar-accent" />
                Forecast horizon tailored to {selectedVessel.name} location ({activeTelemetry.regionName}).
              </span>
              <span>Updated: {activeTelemetry.lastUpdated.split('T')[0]}</span>
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Iceberg Intelligence & Interactive Trajectory Forecast */}
      <section className="mt-8">
        <h3 className="font-display text-sm text-white mb-3 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-polar-accent" />
          Iceberg Statistical / Linear Drift Prediction (EPSG:3031)
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard
            title={`Tracked Giant Antarctic Icebergs (${processedIcebergs.length}) — Click to Track Trajectory`}
            icon={TableIcon}
            className="lg:col-span-2"
          >
            <DataTable
              columns={ICEBERG_COLUMNS}
              rows={processedIcebergs}
              onRowClick={(row) => setSelectedIcebergId(row.rawId)}
              selectedRowId={selectedIcebergId}
              emptyTitle="No icebergs tracked"
              emptyDescription="Detected icebergs will be listed here."
            />
          </SectionCard>

          {/* Iceberg Trajectory Card */}
          <SectionCard title={`Trajectory Drift Forecast: ${activeTrajectory?.icebergName || activeBerg.id}`} icon={Route}>
            {activeTrajectory ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-polar-base p-3 rounded border border-polar-border">
                  <div>
                    <span className="text-gray-400 block">Drift Velocity</span>
                    <span className="text-white font-mono font-semibold text-sm">{activeTrajectory.speedKmPerDay} km/day</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Heading Bearing</span>
                    <span className="text-white font-mono font-semibold text-sm">{activeTrajectory.directionDegrees}°</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-400 block">Observation Base</span>
                    <span className="text-polar-accent font-mono">{activeTrajectory.lastObservedDate}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-400 block">Model Confidence</span>
                    <span className="text-green-400 font-mono">{activeTrajectory.confidence}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-polar-accent" />
                    7-Day Projected Drift Waypoints
                  </h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {activeTrajectory.predictedPath.map((pt, i) => (
                      <div key={i} className="flex justify-between items-center bg-polar-raised/60 p-2 rounded text-[11px] border border-polar-border hover:border-polar-accent/50 transition-colors">
                        <span className="font-mono text-polar-accent">Day +{pt.day} ({pt.date})</span>
                        <span className="font-mono text-gray-200">{pt.lat.toFixed(3)}°, {pt.lon.toFixed(3)}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </SectionCard>
        </div>
      </section>
    </div>
  );
}

function getCompassDirection(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
