'use client';

import { useEffect, useState } from 'react';
import { User, Ship } from 'lucide-react';
import ConnectivityIndicator from './ConnectivityIndicator';
import { useVessel } from '@/context/VesselContext';

function formatUtc(date) {
  return date.toISOString().slice(11, 19) + ' UTC';
}

export default function TopHeader({ title }) {
  const [time, setTime] = useState(null);
  const { activeVessel } = useVessel();

  useEffect(() => {
    setTime(formatUtc(new Date()));
    const id = setInterval(() => setTime(formatUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-polar-border bg-polar-surface/80 backdrop-blur px-4 md:px-6">
      <div className="min-w-0">
        <h1 className="font-display text-base md:text-lg text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-[11px] text-[#6b7f8f] flex items-center gap-1">
            <Ship className="h-3 w-3 text-polar-accent" /> Active Vessel
          </span>
          <span className="text-sm text-polar-accent font-semibold">{activeVessel.name}</span>
        </div>

        <div className="hidden md:block h-8 w-px bg-polar-border" />

        <ConnectivityIndicator status="ONLINE" />

        <div className="hidden sm:flex flex-col items-end leading-tight font-mono">
          <span className="text-[11px] text-[#6b7f8f] font-sans">UTC</span>
          <span className="text-sm text-ice tabular-nums" suppressHydrationWarning>
            {time ?? '--:--:--'}
          </span>
        </div>

        <button
          type="button"
          aria-label="User profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-polar-border bg-polar-raised text-[#8fa3b3] hover:text-ice hover:border-ice/40 transition-colors"
        >
          <User className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
