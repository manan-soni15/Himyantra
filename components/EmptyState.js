import { Hourglass } from 'lucide-react';

export default function EmptyState({ icon: Icon = Hourglass, title, description, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-md border border-dashed border-polar-borderLight bg-polar-raised/40 ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-polar-border bg-polar-surface mb-3">
        <Icon className="h-4.5 w-4.5 text-ice/70" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-[#c3d3dd]">{title}</p>
      {description && <p className="mt-1 text-xs text-[#6b7f8f] max-w-xs">{description}</p>}
    </div>
  );
}
