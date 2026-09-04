// data/alerts.js
// Polar navigation warnings and iceberg proximity alerts

export const alerts = [
  {
    id: "ALT-2026-001",
    severity: "Critical",
    title: "Giant Iceberg A81 Rapid Drift",
    description: "Iceberg A81 (1,341 sq km) drifting at 14.2 km/day NW toward South Georgia shipping lane.",
    timestamp: "2026-08-27T02:15:00Z",
    location: [-58.74, -49.93],
    affectedRoutes: ["Route 2 - Weddell Traverse", "Route 3 - South Georgia Passage"],
  },
  {
    id: "ALT-2026-002",
    severity: "High",
    title: "Sea-Ice Concentration Expansion",
    description: "Bransfield Strait ice concentration predicted to increase from 42% to 76% in next 48 hours.",
    timestamp: "2026-08-26T18:40:00Z",
    location: [-63.50, -61.20],
    affectedRoutes: ["Direct Route"],
  },
  {
    id: "ALT-2026-003",
    severity: "Moderate",
    title: "Gale Warning - Drake Passage",
    description: "Westerly winds gusting to 45 knots with wave heights exceeding 5.5 meters.",
    timestamp: "2026-08-26T12:00:00Z",
    location: [-58.50, -64.20],
    affectedRoutes: ["All Drake Transits"],
  },
];

export default alerts;
