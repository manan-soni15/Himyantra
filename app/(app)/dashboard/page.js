"use client";

import dynamic from "next/dynamic";

import {
  Percent,
  Radar,
  ShieldAlert,
  Fuel,
  Map,
  Snowflake,
  CloudSun,
  Route as RouteIcon,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import SectionCard from "@/components/SectionCard";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";

// Dynamically import Leaflet map because Leaflet only works in the browser
const AntarcticMap = dynamic(
  () => import("@/components/map/AntarcticMap"),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-md border border-polar-borderLight bg-polar-raised/40 md:min-h-[22rem]">
        <p className="text-sm text-[#c3d3dd]">
          Loading Antarctic map...
        </p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return (
    <div>
      {/* Page Header */}
      <PageHeader
        eyebrow="Live operational overview"
        title="Mission Control"
        description="Consolidated view of ice conditions, iceberg threats, and route status for the current voyage."
        action={<StatusBadge status="safe" label="All Systems Nominal" />}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Sea-Ice Concentration"
          value="—"
          unit="%"
          icon={Percent}
          status="info"
          hint="Awaiting feed"
        />

        <KpiCard
          label="Icebergs Detected"
          value="—"
          icon={Radar}
          status="info"
          hint="Awaiting feed"
        />

        <KpiCard
          label="Navigation Risk"
          value="—"
          icon={ShieldAlert}
          status="info"
          hint="Awaiting feed"
        />

        <KpiCard
          label="Fuel Remaining"
          value="—"
          unit="%"
          icon={Fuel}
          status="info"
          hint="Awaiting feed"
        />
      </div>

      {/* Map + Side Panels */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        
        {/* Antarctic Map */}
        <SectionCard
          title="Antarctic Operating Area"
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
            <EmptyState title="Route recommendation will appear here." />
          </SectionCard>

          {/* Weather */}
          <SectionCard
            title="Weather Conditions"
            icon={CloudSun}
            className="flex-1"
          >
            <EmptyState title="Weather feed coming soon." />
          </SectionCard>

        </div>
      </div>

      {/* Lower Panels */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        
        {/* Sea Ice Forecast */}
        <SectionCard
          title="Sea-Ice Forecast"
          icon={Snowflake}
        >
          <EmptyState
            title="Forecast panel coming soon."
            description="24h and 48h sea-ice concentration outlook."
          />
        </SectionCard>

        {/* Iceberg Threats */}
        <SectionCard
          title="Iceberg Threats"
          icon={ShieldAlert}
        >
          <EmptyState
            title="No threats to display yet."
            description="Nearby icebergs will be ranked by risk here."
          />
        </SectionCard>

      </div>
    </div>
  );
}