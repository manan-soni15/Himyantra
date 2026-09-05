// data/routes.js
// Prototype Mock Dataset: Predefined Candidate Routes
// In Phase 2, these routes are only evaluated relative to their geometry.
// All metrics (distance, fuel, time, risk) are dynamically evaluated.

export const candidateRoutes = [
  {
    id: "route-max-safety",
    name: "Maximum Safety (Ice Avoidance)",
    description: "Navigates around major sea-ice concentrations and tracked iceberg clusters via open water corridors.",
    waypoints: [
      { lat: -54.80, lon: -68.30, label: "Ushuaia Departure" },
      { lat: -58.50, lon: -64.20, label: "Drake Open Channel" },
      { lat: -62.10, lon: -60.50, label: "South Shetland Gap" },
      { lat: -64.77, lon: -64.08, label: "Palmer Station Approach" },
    ],
  },
  {
    id: "route-balanced",
    name: "Balanced Route (Recommended)",
    description: "Optimal trade-off between voyage time, fuel consumption, and manageable ice risk.",
    waypoints: [
      { lat: -54.80, lon: -68.30, label: "Ushuaia Departure" },
      { lat: -59.20, lon: -62.80, label: "Mid-Drake Transit" },
      { lat: -63.50, lon: -61.20, label: "Bransfield Strait Entrance" },
      { lat: -64.77, lon: -64.08, label: "Palmer Station Approach" },
    ],
  },
  {
    id: "route-min-time",
    name: "Direct Minimum Time Route",
    description: "Shortest distance trajectory penetrating light sea-ice belts.",
    waypoints: [
      { lat: -54.80, lon: -68.30, label: "Ushuaia Departure" },
      { lat: -60.00, lon: -62.00, label: "Direct Drake Traverse" },
      { lat: -64.00, lon: -62.50, label: "Gerlache Strait" },
      { lat: -64.77, lon: -64.08, label: "Palmer Station Approach" },
    ],
  },
];

export const routes = candidateRoutes;
export default routes;
