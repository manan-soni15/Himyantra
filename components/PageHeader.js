export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow && <p className="text-xs text-ice/80 mb-1">{eyebrow}</p>}
        <h2 className="font-display text-xl md:text-2xl text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#8fa3b3] max-w-xl">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
