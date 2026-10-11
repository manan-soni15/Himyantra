const ICE_CLASS_LIMITS = {
  PC1: 95,
  PC2: 90,
  PC3: 85,
  PC4: 75,
  PC5: 65,
  PC6: 45,
  PC7: 30,
  UNCLASSED: 15,
};

function clamp(value) {
  return Math.min(100, Math.max(0, value));
}

function concentrationToRisk(concentration) {
  if (concentration >= 95) return 100;
  if (concentration >= 90) return 95;
  if (concentration >= 80) return 88;
  if (concentration >= 70) return 78;
  if (concentration >= 60) return 65;
  if (concentration >= 40) return 45;
  if (concentration >= 20) return 25;

  return 10;
}

function vesselExposureRisk(
  concentration,
  iceClass
) {
  const limit =
    ICE_CLASS_LIMITS[iceClass] ??
    ICE_CLASS_LIMITS.UNCLASSED;

  const ratio =
    concentration /
    Math.max(limit, 1);

  if (ratio >= 1.20) return 100;
  if (ratio >= 1.00) return 92;
  if (ratio >= 0.90) return 78;
  if (ratio >= 0.75) return 60;
  if (ratio >= 0.50) return 40;

  return 15;
}

function icebergDistanceRisk(distanceKm) {
  if (distanceKm <= 5) return 100;
  if (distanceKm <= 10) return 92;
  if (distanceKm <= 20) return 75;
  if (distanceKm <= 40) return 50;
  if (distanceKm <= 60) return 30;
  if (distanceKm <= 100) return 15;

  return 5;
}

export function calculateRisk({
  seaIceConcentration = 0,
  icebergProximityKm = 500,
  weatherSeverityIndex = 0,
  vesselIceClass = 'UNCLASSED',
} = {}) {
  const ice =
    Number.isFinite(seaIceConcentration)
      ? clamp(seaIceConcentration)
      : 0;

  const icebergDistance =
    Number.isFinite(icebergProximityKm)
      ? Math.max(0, icebergProximityKm)
      : 500;

  const weather =
    Number.isFinite(weatherSeverityIndex)
      ? clamp(weatherSeverityIndex)
      : 0;

  const iceClass =
    String(vesselIceClass)
      .toUpperCase();

  const concentrationRisk =
    concentrationToRisk(ice);

  const classRisk =
    vesselExposureRisk(
      ice,
      iceClass
    );

  // Sea ice is the dominant current-position factor.
  const seaIceScore =
    Math.max(
      concentrationRisk,
      classRisk
    );

  const icebergScore =
    icebergDistanceRisk(
      icebergDistance
    );

  const weatherScore =
    weather;

  let score =
    seaIceScore * 0.50 +
    icebergScore * 0.30 +
    weatherScore * 0.20;

  const mitigation = {
    PC1: 6,
    PC2: 5,
    PC3: 4,
    PC4: 3,
    PC5: 2,
    PC6: 1,
    PC7: 0,
    UNCLASSED: 0,
  }[iceClass] ?? 0;

  score = Math.round(
    clamp(score - mitigation)
  );

  // Never allow a dense-ice cell to appear low/moderate
  // just because the vessel has a strong ice class.
  if (ice >= 95)
    score = Math.max(score, 75);
  else if (ice >= 90)
    score = Math.max(score, 65);
  else if (ice >= 80)
    score = Math.max(score, 55);

  let level = 'safe';

  if (score >= 75)
    level = 'critical';
  else if (score >= 55)
    level = 'high';
  else if (score >= 35)
    level = 'moderate';

  const factors = [];

  if (ice >= 80) {
    factors.push({
      name:
        'High AMSR2 Sea-Ice Concentration',
      severity: 'High',
      value: `${ice}%`,
    });
  }

  const iceLimit =
    ICE_CLASS_LIMITS[iceClass] ?? 15;

  if (ice > iceLimit) {
    factors.push({
      name:
        `${iceClass} Ice-Class Exposure`,
      severity: 'Critical',
      value:
        `${ice}% > ${iceLimit}% limit`,
    });
  }

  if (icebergDistance <= 20) {
    factors.push({
      name:
        'Iceberg Proximity Warning',
      severity:
        icebergDistance <= 10
          ? 'Critical'
          : 'High',
      value:
        `${icebergDistance.toFixed(1)} km`,
    });
  }

  if (weather >= 60) {
    factors.push({
      name: 'Severe Weather',
      severity: 'High',
      value: `${weather}/100`,
    });
  }

  return {
    score,
    level,
    factors,

    breakdown: {
      seaIceImpact:
        Math.round(seaIceScore * 0.50),

      icebergImpact:
        Math.round(icebergScore * 0.30),

      weatherImpact:
        Math.round(weatherScore * 0.20),

      vesselMitigation:
        mitigation,

      seaIceConcentration:
        ice,

      seaIceRiskScore:
        seaIceScore,

      vesselIceLimit:
        iceLimit,
    },
  };
}

export default calculateRisk;