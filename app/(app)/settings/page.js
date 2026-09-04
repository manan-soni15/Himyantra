'use client';

import { Ship, Compass, Wifi, PlugZap } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { TextField, SelectField } from '@/components/FormField';
import Toggle from '@/components/Toggle';
import Button from '@/components/Button';
import { useVessel } from '@/context/VesselContext';

export default function SettingsPage() {
  const { activeVessel } = useVessel();

  // Dynamic fuel burn rate estimation based on vessel class & displacement
  const estFuelBurn = activeVessel.displacementTons 
    ? `${(activeVessel.displacementTons * 0.0012).toFixed(1)} Tons/day`
    : '14.2 Tons/day';

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Vessel profile, navigation preferences, and connectivity configuration." />

      <div className="flex flex-col gap-4">
        <SectionCard title="Vessel Profile" icon={Ship}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField key={`${activeVessel.id}-name`} id="vesselName" label="Vessel Name" defaultValue={activeVessel.name} />
            <TextField key={`${activeVessel.id}-type`} id="vesselType" label="Vessel Type" defaultValue={activeVessel.type} />
            <TextField key={`${activeVessel.id}-ice`} id="iceClass" label="IMO Ice Class" defaultValue={activeVessel.iceClass} />
            <TextField key={`${activeVessel.id}-speed`} id="cruisingSpeed" label="Cruising Speed" defaultValue={`${activeVessel.maxSpeedKnots} kn`} />
            <TextField key={`${activeVessel.id}-fuel`} id="fuelCapacity" label="Fuel Capacity" defaultValue={`${(activeVessel.fuelCapacityTons || 2400).toLocaleString()} Tons`} />
            <TextField key={`${activeVessel.id}-burn`} id="fuelConsumption" label="Fuel Consumption Rate" defaultValue={estFuelBurn} />
          </div>
        </SectionCard>

        <SectionCard title="Navigation Preferences" icon={Compass}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="primaryObjective"
              label="Primary Objective"
              options={['Maximum Safety', 'Minimum Fuel', 'Minimum Time', 'Balanced']}
            />
            <SelectField
              id="maxRisk"
              label="Maximum Acceptable Risk"
              options={['Safe', 'Moderate', 'High']}
            />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-polar-border bg-polar-raised/40 px-4 py-3">
            <div>
              <p className="text-sm text-[#dbe7ee]">Enable AI Recommendations</p>
              <p className="text-xs text-[#6b7f8f] mt-0.5">Show AI-generated route and risk guidance</p>
            </div>
            <Toggle label="Enable AI Recommendations" defaultChecked />
          </div>
        </SectionCard>

        <SectionCard title="Connectivity" icon={Wifi}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="currentStatus" label="Current Status" defaultValue="ONLINE" disabled />
            <TextField id="lastSync" label="Last Synchronization" placeholder="—" disabled />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-polar-border bg-polar-raised/40 px-4 py-3">
            <div>
              <p className="text-sm text-[#dbe7ee]">Offline Mode</p>
              <p className="text-xs text-[#6b7f8f] mt-0.5">Continue operating with limited internet connectivity</p>
            </div>
            <Toggle label="Offline Mode" />
          </div>
          <div className="mt-4">
            <Button variant="secondary" disabled className="gap-2">
              <PlugZap className="h-4 w-4" strokeWidth={1.75} />
              SIMULATE CONNECTION LOSS
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
