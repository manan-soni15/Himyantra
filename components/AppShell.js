'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import MobileNav from './MobileNav';

const TITLES = {
  '/dashboard': 'Mission Control',
  '/route-planner': 'Route Planner',
  '/ice-intelligence': 'Ice Intelligence',
  '/analytics': 'Voyage Analytics',
  '/settings': 'Settings',
};

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES).find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : 'HIMYANTRA';
}

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-polar-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopHeader title={titleFor(pathname)} />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
