"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import {
  Percent,
  Radar,
  ShieldAlert,
  Fuel,
  Map,
  Snowflake,
  CloudSun,
  Route as RouteIcon,
  CheckCircle2,
  AlertTriangle,
  Wind,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import SectionCard from "@/components/SectionCard";
import StatusBadge from "@/components/StatusBadge";
import { seaIceSummary, seaIceForecastTimeseries } from "@/data/seaIce";
import { icebergs } from "@/data/icebergs";
import { currentWeather } from "@/data/weather";
import { generateRoutes } from "@/lib/routeOptimizer";
import { alerts } from "@/data/alerts";
import { calculateSpatialRiskAtLatLon, getRiskLevel } from "@/lib/spatialRiskGrid";
import { useVessel } from "@/context/VesselContext";

// Dynamically import Leaflet map because Leaflet only works in the browser
const AntarcticMap = dynamic(
  () => import("@/components/map/AntarcticMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-md border border-polar-borderLight bg-polar-raised/40 md:min-h-[22rem]">
        <p className="text-sm text-[#c3d3dd]">
          Loading Antarctic EPSG:3031 map...
        </p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { activeVessel } = useVessel();
  
  const [evaluatedRoutes, setEvaluatedRoutes] = useState([]);

  useEffect(() => {
    let isSubscribed = true;
    generateRoutes({ vessel: activeVessel, objective: 'Safest' })
      .then(routes => {
        if (isSubscribed) setEvaluatedRoutes(routes);
      })
      .catch(err => console.error(err));
    return () => { isSubscribed = false; };
  }, [activeVessel]);

  const spatialRiskData = calculateSpatialRiskAtLatLon(activeVessel.currentPosition[0], activeVessel.currentPosition[1]);
  const currentRisk = {
    score: spatialRiskData ? spatialRiskData.environmentalRisk : 0,
    level: spatialRiskData ? getRiskLevel(spatialRiskData.environmentalRisk).toLowerCase() : 'low'
  };

  const topRecommendedRoute = evaluatedRoutes.find((r) => r.isRecommended) || evaluatedRoutes[0];

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        eyebrow="Simulated Vessel Telemetry"
        title="Mission Control"
        description="Consolidated view of NSIDC ice concentration, iceberg threats, prototype weather, and active route optimization."
        action={<StatusBadge status={currentRisk.level === 'safe' ? 'Safe' : currentRisk.level === 'moderate' ? 'Moderate' : 'High'} label={`Risk: ${currentRisk.level.toUpperCase()}`} />}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Sea-Ice Concentration"
          value={seaIceSummary.currentConcentration}
          unit="%"
          icon={Percent}
          status="info"
          hint="NSIDC CDR 25km Grid"
        />

        <KpiCard
          label="Icebergs Tracked"
          value={icebergs.length}
          icon={Radar}
          status="info"
          hint="Mock Dataset based on USNIC structure"
        />

        <KpiCard
          label="Current Position Risk"
          value={currentRisk.score}
          unit="/100"
          icon={ShieldAlert}
          status={currentRisk.level === 'safe' ? 'safe' : currentRisk.level === 'moderate' ? 'moderate' : 'high'}
          hint={`Band: ${currentRisk.level.toUpperCase()}`}
        />

        <KpiCard
          label="Vessel Fuel Level"
          value={84}
          unit="%"
          icon={Fuel}
          status="safe"
          hint="2,016 / 2,400 Tons"
        />
      </div>

      {/* Map + Side Panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Antarctic Map */}
        <SectionCard
          title="Antarctic Operating Area (EPSG:3031)"
          icon={Map}
          className="lg:col-span-2"
        >
          <AntarcticMap />
        </SectionCard>

        {/* Right Side Panels */}
        <div className="flex flex-col gap-4">
          {/* AI Recommendation */}
          <SectionCard
            title="AI Route Recommendation"
            icon={RouteIcon}
          >
            {topRecommendedRoute ? (
              <div className="p-3 bg-polar-base rounded border border-polar-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {topRecommendedRoute.name}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">
                  {topRecommendedRoute.recommendationExplanation}
                </p>
                <div className="flex justify-between text-gray-400 pt-1 font-mono text-[10px]">
                  <span>Dist: {topRecommendedRoute.distanceNauticalMiles || '--'} NM</span>
                  <span>Fuel: {topRecommendedRoute.estimatedFuelTons || '--'} T</span>
                  <span>ETA: {topRecommendedRoute.estimatedDays || '--'} Days</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-polar-base rounded border border-polar-border text-xs text-gray-400">
                Calculating active route...
              </div>
            )}
          </SectionCard>

          {/* Weather */}
          <SectionCard
            title="Prototype Weather Data"
            icon={CloudSun}
            className="flex-1"
          >
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-polar-base p-2.5 rounded border border-polar-border">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-polar-accent" /> Wind Velocity
                </span>
                <span className="font-mono text-white font-semibold">{currentWeather.windSpeedKnots} kts ({currentWeather.windDirectionDegrees}°)</span>
              </div>
              <div className="flex justify-between items-center bg-polar-base p-2.5 rounded border border-polar-border">
                <span className="text-gray-300">Air / Surface Temp</span>
                <span className="font-mono text-white font-semibold">{currentWeather.airTempCelsius}°C / {currentWeather.seaSurfaceTempCelsius}°C</span>
              </div>
              <div className="flex justify-between items-center bg-polar-base p-2.5 rounded border border-polar-border">
                <span className="text-gray-300">MSL Pressure</span>
                <span className="font-mono text-white font-semibold">{currentWeather.mslPressureHpa} hPa</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Lower Panels */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Sea Ice Forecast */}
        <SectionCard
          title="Sea-Ice 48h Outlook (NSIDC)"
          icon={Snowflake}
        >
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-polar-base rounded border border-polar-border">
              <div className="text-[10px] text-gray-400">Current</div>
              <div className="text-sm font-bold text-white mt-1">{seaIceSummary.currentConcentration}%</div>
            </div>
            <div className="p-2.5 bg-polar-base rounded border border-polar-border">
              <div className="text-[10px] text-gray-400">+24h Forecast</div>
              <div className="text-sm font-bold text-white mt-1">{seaIceSummary.forecast24h}%</div>
            </div>
            <div className="p-2.5 bg-polar-base rounded border border-polar-border">
              <div className="text-[10px] text-gray-400">+48h Forecast</div>
              <div className="text-sm font-bold text-white mt-1">{seaIceSummary.forecast48h}%</div>
            </div>
            <div className="p-2.5 bg-polar-base rounded border border-polar-border">
              <div className="text-[10px] text-gray-400">Confidence</div>
              <div className="text-sm font-bold text-polar-accent mt-1">{seaIceSummary.predictionConfidence}%</div>
            </div>
          </div>
        </SectionCard>

        {/* Iceberg Threat Warnings */}
        <SectionCard
          title="Active Iceberg Threat Warnings"
          icon={ShieldAlert}
        >
          <div className="space-y-2 text-xs">
            {alerts.map((alt) => (
              <div key={alt.id} className="p-2.5 bg-polar-base rounded border border-polar-border flex items-start gap-2.5">
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${alt.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{alt.title}</span>
                    <StatusBadge status={alt.severity} />
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">{alt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}