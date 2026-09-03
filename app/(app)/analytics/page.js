import { Navigation, MapPin, Fuel, Droplet, Gauge, Clock, TrendingUp, ShieldAlert, Snowflake, GitCompare } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/KpiCard';
import SectionCard from '@/components/SectionCard';

const CHARTS = [
  { title: 'Fuel Consumption', icon: TrendingUp },
  { title: 'Navigation Risk', icon: ShieldAlert },
  { title: 'Sea-Ice Trend', icon: Snowflake },
  { title: 'Route Comparison', icon: GitCompare },
];

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Voyage Analytics"
        description="Voyage-level performance metrics and trends for the current expedition."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Distance Travelled" value="—" unit="nm" icon={Navigation} />
        <KpiCard label="Distance Remaining" value="—" unit="nm" icon={MapPin} />
        <KpiCard label="Fuel Consumed" value="—" unit="%" icon={Fuel} />
        <KpiCard label="Fuel Remaining" value="—" unit="%" icon={Droplet} />
        <KpiCard label="Average Speed" value="—" unit="kn" icon={Gauge} />
        <KpiCard label="Estimated Arrival" value="—" icon={Clock} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {CHARTS.map((chart) => {
          const Icon = chart.icon;
          return (
            <SectionCard key={chart.title} title={chart.title} icon={Icon}>
              <div className="flex h-52 items-center justify-center rounded-md border border-dashed border-polar-borderLight bg-polar-raised/40">
                <p className="text-sm text-[#6b7f8f]">Chart will render here</p>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
