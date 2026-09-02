'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, Route, Snowflake, BarChart3, Settings, Compass } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Mission Control', icon: Radar },
  { href: '/route-planner', label: 'Route Planner', icon: Route },
  { href: '/ice-intelligence', label: 'Ice Intelligence', icon: Snowflake },
  { href: '/analytics', label: 'Voyage Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-polar-border bg-polar-surface">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-polar-border">
        <Compass className="h-5 w-5 text-ice" strokeWidth={1.75} />
        <span className="font-display text-[15px] tracking-wide text-white">HIMYANTRA</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-ice/10 text-white border border-ice/25'
                  : 'text-[#8fa3b3] border border-transparent hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              <Icon
                className={['h-4 w-4', active ? 'text-ice' : 'text-[#6b7f8f] group-hover:text-ice'].join(' ')}
                strokeWidth={1.75}
              />
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ice" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-polar-border">
        <Link
          href="/settings"
          className={[
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-ice/10 text-white border border-ice/25'
              : 'text-[#8fa3b3] border border-transparent hover:text-white hover:bg-white/5',
          ].join(' ')}
        >
          <Settings
            className={['h-4 w-4', pathname === '/settings' ? 'text-ice' : 'text-[#6b7f8f]'].join(' ')}
            strokeWidth={1.75}
          />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
