import { Ship, Compass, Wifi, PlugZap } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { TextField, SelectField } from '@/components/FormField';
import Toggle from '@/components/Toggle';
import Button from '@/components/Button';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Vessel profile, navigation preferences, and connectivity configuration." />

      <div className="flex flex-col gap-4">
        <SectionCard title="Vessel Profile" icon={Ship}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="vesselName" label="Vessel Name" defaultValue="Research Vessel A" />
            <TextField id="vesselType" label="Vessel Type" placeholder="e.g. Icebreaker" />
            <TextField id="iceClass" label="Ice Class" placeholder="e.g. PC3" />
            <TextField id="cruisingSpeed" label="Cruising Speed" placeholder="e.g. 14 kn" />
            <TextField id="fuelCapacity" label="Fuel Capacity" placeholder="e.g. 1,200 t" />
            <TextField id="fuelConsumption" label="Fuel Consumption" placeholder="e.g. 18 t/day" />
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
