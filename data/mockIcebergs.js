// data/mockIcebergs.js
// Final Phase 3.1: Developer-Editable Rich Iceberg Dataset

export const mockIcebergs = [
    {
      id: "A-76A",
      name: "Iceberg A-76A",
      position: [-63.5, -55.2], // lat, lon
      lengthKm: 135,
      widthKm: 26,
      heightM: 200,
      area: 3510,
      volumeKm3: 702, // area * (height / 1000)
      speedKnots: 0.5,
      headingDegrees: 45,
      movementStatus: "Drifting Northeast",
      sourceType: "USNIC Mock Data",
      confidence: 95,
      lastUpdated: "2026-09-04T12:00:00Z",
      history: [
        { lat: -63.8, lon: -56.0, date: "2026-09-02T12:00:00Z" },
        { lat: -64.1, lon: -57.1, date: "2026-08-30T12:00:00Z" }
      ]
    },
    {
      id: "D-30A",
      name: "Iceberg D-30A",
      position: [-70.1, -10.5],
      lengthKm: 72,
      widthKm: 20,
      heightM: 150,
      area: 1440,
      volumeKm3: 216,
      speedKnots: 0.2,
      headingDegrees: 270,
      movementStatus: "Slow Drift West",
      sourceType: "USNIC Mock Data",
      confidence: 90,
      lastUpdated: "2026-09-04T12:00:00Z",
      history: [
        { lat: -70.1, lon: -9.5, date: "2026-08-25T12:00:00Z" }
      ]
    },
    {
      id: "B-15_FRAG_1",
      name: "B-15 Fragment",
      position: [-62.0, -50.0],
      lengthKm: 15,
      widthKm: 8,
      heightM: 100,
      area: 120,
      volumeKm3: 12,
      speedKnots: 1.1,
      headingDegrees: 60,
      movementStatus: "Fast Drift",
      sourceType: "USNIC Mock Data",
      confidence: 85,
      lastUpdated: "2026-09-04T12:00:00Z",
      history: [
        { lat: -62.5, lon: -51.2, date: "2026-09-02T12:00:00Z" },
        { lat: -63.0, lon: -52.5, date: "2026-08-30T12:00:00Z" }
      ]
    },
    {
      // Malformed iceberg for validation testing
      id: "INVALID-1",
      name: "Invalid Iceberg",
      position: [1000, 2000], // Invalid coordinates
      lengthKm: -10,
      widthKm: -5,
      heightM: -100,
      area: -50,
      volumeKm3: -5,
      speedKnots: -1,
      headingDegrees: 400,
      movementStatus: "Unknown",
      sourceType: "Test",
      confidence: 0,
      lastUpdated: "2026-09-04T12:00:00Z",
      history: []
    }
  ];
  
  export default mockIcebergs;
