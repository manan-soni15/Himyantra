const STATUS_ACCENT = {
  safe: 'text-status-safe',
  moderate: 'text-status-moderate',
  high: 'text-status-high',
  critical: 'text-status-critical',
  info: 'text-status-info',
};

export default function KpiCard({ label, value, unit, icon: Icon, status = 'info', hint }) {
  const accent = STATUS_ACCENT[status] ?? STATUS_ACCENT.info;
  return (
    <div className="rounded-lg border border-polar-border bg-polar-surface px-4 py-4 shadow-panel">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8fa3b3]">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${accent}`} strokeWidth={1.75} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl text-white tabular-nums">{value}</span>
        {unit && <span className="text-xs text-[#6b7f8f]">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#6b7f8f]">{hint}</p>}
    </div>
  );
}
