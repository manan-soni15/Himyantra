export default function SectionCard({ title, icon: Icon, action, children, className = '', bodyClassName = '' }) {
  return (
    <section
      className={`rounded-lg border border-polar-border bg-polar-surface shadow-panel ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-polar-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-4 w-4 text-ice shrink-0" strokeWidth={1.75} />}
            {title && (
              <h2 className="font-display text-sm text-white tracking-wide truncate">{title}</h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
