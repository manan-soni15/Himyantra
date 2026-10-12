'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { User, Ship, ChevronDown } from 'lucide-react';
import ConnectivityIndicator from './ConnectivityIndicator';
import { useVessel } from '@/context/VesselContext';

function formatUtc(date) {
  return date.toISOString().slice(11, 19) + ' UTC';
}

export default function TopHeader({ title }) {
  const [time, setTime] = useState(null);
  const [isVesselOpen, setIsVesselOpen] = useState(false);

  const pathname = usePathname();

  const {
    activeVessel,
    activeVesselId,
    setActiveVesselId,
    vessels,
  } = useVessel();

  const isMissionControl = pathname === '/dashboard';

  const vesselDropdownRef = useRef(null);

  useEffect(() => {
    setTime(formatUtc(new Date()));

    const id = setInterval(() => {
      setTime(formatUtc(new Date()));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        vesselDropdownRef.current &&
        !vesselDropdownRef.current.contains(event.target)
      ) {
        setIsVesselOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const selectedVessel =
    vessels.find((vessel) => vessel.id === activeVesselId) ||
    activeVessel;

  return (
    <header className="flex h-16 items-center justify-between border-b border-polar-border bg-polar-surface/80 backdrop-blur px-4 md:px-6">
      {/* Page Title */}
      <div className="min-w-0">
        <h1 className="font-display text-base md:text-lg text-white truncate">
          {title}
        </h1>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-3 md:gap-5">
        {isMissionControl ? (
          /* ================================
             Mission Control Vessel Dropdown
          ================================= */
          <div
            ref={vesselDropdownRef}
            className="hidden sm:block relative"
          >
            {/* Dropdown Trigger */}
            <button
              type="button"
              onClick={() =>
                setIsVesselOpen((previous) => !previous)
              }
              className={`
                flex min-w-[250px] items-center justify-between
                gap-4
                rounded-md
                border
                px-3 py-2
                text-left
                transition-all
                ${
                  isVesselOpen
                    ? 'border-polar-accent bg-[#0b131e]'
                    : 'border-transparent hover:border-polar-border'
                }
              `}
              aria-haspopup="listbox"
              aria-expanded={isVesselOpen}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Ship className="h-4 w-4 shrink-0 text-polar-accent" />

                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] text-[#6b7f8f]">
                    Active Vessel
                  </div>

                  <div className="truncate text-sm font-semibold text-polar-accent">
                    {selectedVessel?.name || 'Select Vessel'}
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`
                  h-4 w-4 shrink-0 text-polar-accent
                  transition-transform duration-200
                  ${isVesselOpen ? 'rotate-180' : ''}
                `}
              />
            </button>

            {/* Dropdown Menu */}
            {isVesselOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  z-[9999]
                  mt-1
                  w-[320px]
                  overflow-hidden
                  rounded-md
                  border border-slate-600
                  bg-[#0b131e]
                  shadow-2xl
                "
                role="listbox"
              >
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {vessels.map((vessel) => {
                    const isActive =
                      vessel.id === activeVesselId;

                    return (
                      <button
                        key={vessel.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setActiveVesselId(vessel.id);
                          setIsVesselOpen(false);
                        }}
                        className={`
                          flex w-full items-center justify-between
                          gap-3
                          px-4 py-3
                          text-left
                          transition-colors
                          ${
                            isActive
                              ? 'bg-[#18283a] text-cyan-300'
                              : 'text-slate-200 hover:bg-[#142131]'
                          }
                        `}
                      >
                        <span className="truncate text-sm font-medium">
                          {vessel.name}
                        </span>

                        <span
                          className={`
                            shrink-0
                            text-sm
                            font-medium
                            ${
                              isActive
                                ? 'text-cyan-300'
                                : 'text-slate-400'
                            }
                          `}
                        >
                          ({vessel.iceClass})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================================
             Other Pages - Read Only Vessel
          ================================= */
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-[11px] text-[#6b7f8f] flex items-center gap-1">
              <Ship className="h-3 w-3 text-polar-accent" />
              Active Vessel
            </span>

            <span className="text-sm text-polar-accent font-semibold">
              {activeVessel.name}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-polar-border" />

        {/* Connectivity */}
        <ConnectivityIndicator status="ONLINE" />

        {/* UTC */}
        <div className="hidden sm:flex flex-col items-end leading-tight font-mono">
          <span className="text-[11px] text-[#6b7f8f] font-sans">
            UTC
          </span>

          <span
            className="text-sm text-ice tabular-nums"
            suppressHydrationWarning
          >
            {time ?? '--:--:--'}
          </span>
        </div>

        {/* Profile */}
        <button
          type="button"
          aria-label="User profile"
          className="
            flex h-8 w-8 items-center justify-center
            rounded-full
            border border-polar-border
            bg-polar-raised
            text-[#8fa3b3]
            transition-colors
            hover:text-ice
            hover:border-ice/40
          "
        >
          <User
            className="h-4 w-4"
            strokeWidth={1.75}
          />
        </button>
      </div>
    </header>
  );
}