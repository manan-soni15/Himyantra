'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar, Route, Snowflake, BarChart3, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Control', icon: Radar },
  { href: '/route-planner', label: 'Routes', icon: Route },
  { href: '/ice-intelligence', label: 'Ice', icon: Snowflake },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-polar-border bg-polar-surface/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px]',
                  active ? 'text-ice' : 'text-[#6b7f8f]',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
