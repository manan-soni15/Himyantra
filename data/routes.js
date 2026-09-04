// data/routes.js
// Antarctic polar navigation routes and waypoints

export const candidateRoutes = [
  {
    id: "route-max-safety",
    name: "Maximum Safety (Ice Avoidance)",
    objective: "Maximum Safety",
    description: "Navigates around major sea-ice concentrations and tracked iceberg clusters via open water corridors.",
    distanceNauticalMiles: 742,
    estimatedDays: 2.8,
    avgRiskScore: 18,
    riskBand: "Safe",
    estimatedFuelTons: 64,
    aiScore: 94,
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
    objective: "Balanced",
    description: "Optimal trade-off between voyage time, fuel consumption, and manageable ice risk.",
    distanceNauticalMiles: 685,
    estimatedDays: 2.3,
    avgRiskScore: 34,
    riskBand: "Moderate",
    estimatedFuelTons: 52,
    aiScore: 91,
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
    objective: "Minimum Time",
    description: "Shortest distance trajectory penetrating light sea-ice belts. Higher risk score.",
    distanceNauticalMiles: 620,
    estimatedDays: 1.9,
    avgRiskScore: 68,
    riskBand: "High",
    estimatedFuelTons: 58,
    aiScore: 76,
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
