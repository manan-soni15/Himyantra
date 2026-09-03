import Link from 'next/link';
import { Snowflake, ShieldAlert, Route, ArrowRight, Eye, Brain, Gauge, Compass, Navigation } from 'lucide-react';

const FLOW_STEPS = [
  { label: 'Observe', icon: Eye },
  { label: 'Predict', icon: Brain },
  { label: 'Assess', icon: Gauge },
  { label: 'Optimize', icon: Compass },
  { label: 'Navigate', icon: Navigation },
];

const FEATURES = [
  {
    icon: Snowflake,
    title: 'Predict Ice',
    description:
      'Forecast sea-ice concentration and iceberg drift ahead of the vessel, so course changes happen before conditions close in.',
  },
  {
    icon: ShieldAlert,
    title: 'Assess Risk',
    description:
      'Continuously score navigation risk from ice, weather, and vessel capability into a single, explainable readout.',
  },
  {
    icon: Route,
    title: 'Optimize Routes',
    description:
      'Compare routes across safety, fuel, and time, with a transparent rationale behind every recommendation.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-polar-bg">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-polar-grid bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-ice/10 blur-[120px]" />

      <div className="relative">
        {/* Nav */}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-ice" strokeWidth={1.75} />
            <span className="font-display text-sm tracking-wide text-white">HIMYANTRA</span>
          </div>
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#8fa3b3] hover:text-ice transition-colors"
          >
            Mission Control
          </Link>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center md:pt-24">
          <p className="text-xs text-ice/80">
            Antarctic Sea-Ice, Iceberg Trajectory &amp; Navigation Decision Support
          </p>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] text-white sm:text-6xl md:text-7xl">
            HIMYANTRA
          </h1>
          <p className="font-display mt-4 text-lg text-ice-soft sm:text-xl">
            Intelligent Navigation Through the Frozen Frontier
          </p>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#8fa3b3]">
            AI-powered Antarctic environmental intelligence for safer and more fuel-efficient
            research-vessel navigation.
          </p>

          <div className="mt-9 flex justify-center">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-md border border-ice bg-ice px-6 py-3 text-sm font-medium text-[#04141d] transition-colors hover:bg-ice-soft"
            >
              ENTER MISSION CONTROL
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* Process flow */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-lg border border-polar-border bg-polar-surface/60 px-4 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              {FLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-6 sm:gap-0 sm:flex-col sm:items-center">
                    <div className="flex sm:flex-col items-center gap-3 sm:gap-2.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ice/30 bg-ice/5">
                        <Icon className="h-4.5 w-4.5 text-ice" strokeWidth={1.75} />
                      </div>
                      <span className="text-sm text-[#dbe7ee]">{step.label}</span>
                    </div>
                    {i < FLOW_STEPS.length - 1 && (
                      <div
                        className="hidden sm:block h-px w-16 bg-gradient-to-r from-ice/40 to-ice/0 mx-2"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-lg border border-polar-border bg-polar-surface p-5 shadow-panel"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-ice/25 bg-ice/5">
                    <Icon className="h-4.5 w-4.5 text-ice" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display mt-4 text-[15px] text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#8fa3b3]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-polar-border px-6 py-6 text-center text-xs text-[#5c6f7d]">
          HIMYANTRA — Decision support for polar research operations.
        </footer>
      </div>
    </main>
  );
}
