'use client';

import { useState } from 'react';
import { Sparkles, Map, Table2, BrainCircuit } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { TextField, SelectField } from '@/components/FormField';
import DataTable from '@/components/DataTable';

const OBJECTIVES = ['Maximum Safety', 'Minimum Fuel', 'Minimum Time', 'Balanced'];

const COMPARISON_COLUMNS = [
  { key: 'route', label: 'Route' },
  { key: 'distance', label: 'Distance' },
  { key: 'risk', label: 'Risk' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'eta', label: 'ETA' },
  { key: 'aiScore', label: 'AI Score' },
];

export default function RoutePlannerPage() {
  const [message, setMessage] = useState('');

  return (
    <div>
      <PageHeader
        title="Route Planner"
        description="Configure a voyage and generate AI-optimized route options once the routing engine is available."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Route configuration */}
        <SectionCard title="Route Configuration" icon={Sparkles} className="lg:col-span-1 h-fit">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setMessage('Route analysis will be available in the next development phase');
            }}
          >
            <SelectField
              id="vessel"
              label="Vessel"
              options={[{ value: 'rva', label: 'Research Vessel A' }]}
              defaultValue="rva"
            />
            <TextField id="start" label="Starting Point" placeholder="e.g. McMurdo Station" />
            <TextField id="destination" label="Destination" placeholder="e.g. Ross Sea Waypoint 4" />
            <SelectField
              id="objective"
              label="Navigation Objective"
              options={OBJECTIVES.map((o) => ({ value: o, label: o }))}
            />
            <Button type="submit" className="w-full">
              GENERATE AI ROUTES
            </Button>
            {message && (
              <p className="rounded-md border border-ice/25 bg-ice/5 px-3 py-2.5 text-xs text-ice-soft">
                {message}
              </p>
            )}
          </form>
        </SectionCard>

        {/* Visualization + comparison */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Route Visualization" icon={Map}>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-polar-borderLight bg-polar-raised/40">
              <p className="text-sm text-[#6b7f8f]">Route map will render here</p>
            </div>
          </SectionCard>

          <SectionCard title="Route Comparison" icon={Table2}>
            <DataTable
              columns={COMPARISON_COLUMNS}
              rows={[]}
              emptyTitle="No routes generated yet"
              emptyDescription="Generate AI routes to compare distance, risk, fuel, ETA, and AI score."
            />
          </SectionCard>

          <SectionCard title="AI Recommendation" icon={BrainCircuit}>
            <EmptyState title="Route recommendation will appear here." />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
