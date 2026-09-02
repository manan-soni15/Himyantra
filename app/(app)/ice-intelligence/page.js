import { Snowflake, Gauge, LineChart, Route, TableIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import KpiCard from '@/components/KpiCard';
import EmptyState from '@/components/EmptyState';
import DataTable from '@/components/DataTable';

const ICEBERG_COLUMNS = [
  { key: 'id', label: 'Iceberg ID' },
  { key: 'position', label: 'Position' },
  { key: 'size', label: 'Size' },
  { key: 'speed', label: 'Speed' },
  { key: 'direction', label: 'Direction' },
  { key: 'risk', label: 'Risk' },
];

export default function IceIntelligencePage() {
  return (
    <div>
      <PageHeader
        title="Ice Intelligence"
        description="Sea-ice concentration outlook and iceberg tracking for the operating area."
      />

      {/* Sea-Ice Intelligence */}
      <section>
        <h3 className="font-display text-sm text-white mb-3">Sea-Ice Intelligence</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard label="Current Concentration" value="—" unit="%" icon={Snowflake} />
          <KpiCard label="24h Forecast" value="—" unit="%" icon={Snowflake} />
          <KpiCard label="48h Forecast" value="—" unit="%" icon={Snowflake} />
          <KpiCard label="Prediction Confidence" value="—" unit="%" icon={Gauge} />
        </div>

        <SectionCard title="Sea-Ice Concentration Forecast" icon={LineChart} className="mt-4">
          <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-polar-borderLight bg-polar-raised/40">
            <p className="text-sm text-[#6b7f8f]">Forecast chart will render here</p>
          </div>
        </SectionCard>
      </section>

      {/* Iceberg Intelligence */}
      <section className="mt-8">
        <h3 className="font-display text-sm text-white mb-3">Iceberg Intelligence</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Tracked Icebergs" icon={TableIcon} className="lg:col-span-2">
            <DataTable
              columns={ICEBERG_COLUMNS}
              rows={[]}
              emptyTitle="No icebergs tracked yet"
              emptyDescription="Detected icebergs will be listed here with position, size, and risk."
            />
          </SectionCard>
          <SectionCard title="Iceberg Trajectory" icon={Route}>
            <EmptyState
              title="Trajectory prediction coming soon."
              description="Predicted drift paths will be visualized here."
            />
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
