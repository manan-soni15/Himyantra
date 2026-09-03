const STATUS_STYLES = {
  safe: 'text-status-safe bg-status-safe/10 border-status-safe/30',
  moderate: 'text-status-moderate bg-status-moderate/10 border-status-moderate/30',
  high: 'text-status-high bg-status-high/10 border-status-high/30',
  critical: 'text-status-critical bg-status-critical/10 border-status-critical/30',
  info: 'text-status-info bg-status-info/10 border-status-info/30',
};

const STATUS_LABELS = {
  safe: 'Safe',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
  info: 'Info',
};

export default function StatusBadge({ status = 'info', label }) {
  const classes = STATUS_STYLES[status] ?? STATUS_STYLES.info;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}
