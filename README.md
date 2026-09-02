# HIMYANTRA — Initial Frontend Foundation

AI-enabled Antarctic Sea-Ice, Iceberg Trajectory, and Navigation Decision Support System.

This is the **initial UI foundation only** — routing, layout, and reusable components are in
place, but AI models, maps, forecasting, and real data integrations are intentionally left
as placeholders for later development phases.

## Tech stack

- Next.js 14 (App Router)
- JavaScript (no TypeScript)
- Tailwind CSS
- lucide-react icons

No shadcn/ui, UI-kit, or backend/database dependencies were added — every visual component
(buttons, form fields, tables, badges, cards) is hand-built in `/components` to keep the
dependency footprint minimal, per the build brief.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

To verify a production build:

```bash
npm run build
npm start
```

## Folder structure

```
app/
  page.js                  → Landing page ( / )
  layout.js                → Root layout: fonts, global styles
  globals.css               → Tailwind + polar theme tokens/animations
  (app)/                    → Route group for all authenticated/app pages
    layout.js               → Wraps pages in the shared AppShell (sidebar + header)
    dashboard/page.js        → Mission Control ( /dashboard )
    route-planner/page.js    → Route Planner ( /route-planner )
    ice-intelligence/page.js → Ice Intelligence ( /ice-intelligence )
    analytics/page.js        → Voyage Analytics ( /analytics )
    settings/page.js         → Settings ( /settings )

components/
  AppShell.js       → Combines Sidebar + TopHeader + MobileNav + page content
  Sidebar.js        → Left navigation, active-route highlighting
  MobileNav.js      → Bottom tab bar for small screens
  TopHeader.js      → Page title, vessel name, connectivity, live UTC clock, profile icon
  ConnectivityIndicator.js → ONLINE/OFFLINE pill used in TopHeader and Settings
  PageHeader.js     → In-page title/description/action row
  SectionCard.js    → Bordered panel with title + optional icon/action
  KpiCard.js        → Small metric card (label, value, unit, status icon)
  StatusBadge.js    → Safe/Moderate/High/Critical/Info pill
  EmptyState.js     → "Coming soon" placeholder block
  DataTable.js      → Generic column/row table with built-in empty state
  Button.js         → primary / secondary / ghost variants
  FormField.js      → TextField, SelectField
  Toggle.js         → Switch control (used in Settings)

data/
  vessels.js, icebergs.js, seaIce.js, weather.js, routes.js, alerts.js
  → Empty placeholder data modules. Each exports an empty array to import
    against later without breaking existing UI code.

lib/
  riskEngine.js           → TODO: navigation risk scoring
  routeOptimizer.js       → TODO: AI route generation/ranking
  trajectoryPrediction.js → TODO: iceberg drift prediction
  → Each currently throws a "not implemented yet" error if called, documenting
    the intended inputs/outputs for the next development phase.
```

## Notes

- All pages under `/dashboard`, `/route-planner`, `/ice-intelligence`, `/analytics`,
  and `/settings` share one layout (sidebar + header) via the `(app)` route group —
  the layout code is written once in `AppShell.js`, not duplicated per page.
- The design uses a dark polar theme (deep navy background, ice-blue accent) with
  status colors for Safe / Moderate / High / Critical / Information, as specified
  in the build brief.
- Fonts (Space Grotesk for display, IBM Plex Sans for body, JetBrains Mono for
  data/telemetry readouts) are loaded via a Google Fonts `<link>` tag in
  `app/layout.js`, so an internet connection is needed the first time a page loads
  in a browser.
- No authentication, database, or backend has been added, per the brief.
