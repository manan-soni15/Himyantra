import proj4 from 'proj4';
import { PNG } from 'pngjs';

const GIBS_WMS_URL =
  'https://gibs.earthdata.nasa.gov/wms/epsg3031/best/wms.cgi';

const AMSR2_LAYER =
  'AMSRU2_Sea_Ice_Concentration_25km';

// NASA GIBS AMSR sea-ice concentration colour-map anchors.
const COLOR_ANCHORS = [
  { value: 0, rgb: [17, 17, 17] },
  { value: 10, rgb: [163, 0, 163] },
  { value: 20, rgb: [177, 0, 255] },
  { value: 30, rgb: [7, 0, 255] },
  { value: 40, rgb: [0, 189, 255] },
  { value: 50, rgb: [0, 217, 142] },
  { value: 60, rgb: [30, 180, 0] },
  { value: 70, rgb: [210, 240, 0] },
  { value: 80, rgb: [255, 127, 0] },
  { value: 90, rgb: [255, 51, 51] },
  { value: 100, rgb: [255, 255, 255] },
];

function interpolateColor(value) {
  for (let i = 0; i < COLOR_ANCHORS.length - 1; i++) {
    const a = COLOR_ANCHORS[i];
    const b = COLOR_ANCHORS[i + 1];

    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value);

      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
      ];
    }
  }

  return COLOR_ANCHORS[COLOR_ANCHORS.length - 1].rgb;
}

function rgbDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToConcentration(rgb) {
  let best = null;
  let bestDistance = Infinity;

  for (let value = 0; value <= 100; value++) {
    const expected = interpolateColor(value);
    const distance = rgbDistance(rgb, expected);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = value;
    }
  }

  return bestDistance > 90 ? null : best;
}

function median(values) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export async function sampleAMSR2SeaIce(lat, lon) {
  const [x, y] = proj4(
    'EPSG:4326',
    'EPSG:3031',
    [lon, lat]
  );

  const halfSize = 37500;

  const params = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    version: '1.1.1',
    layers: AMSR2_LAYER,
    styles: 'default',
    srs: 'EPSG:3031',
    bbox: [
      x - halfSize,
      y - halfSize,
      x + halfSize,
      y + halfSize,
    ].join(','),
    width: '9',
    height: '9',
    format: 'image/png',
    transparent: 'true',
  });

  const response = await fetch(
    `${GIBS_WMS_URL}?${params.toString()}`,
    {
      cache: 'no-store',
      headers: {
        Accept: 'image/png',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `NASA GIBS request failed: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  const png = PNG.sync.read(buffer);

  const centerX = Math.floor(png.width / 2);
  const centerY = Math.floor(png.height / 2);

  const values = [];

  // Sample centre + neighbouring pixels.
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const px = centerX + dx;
      const py = centerY + dy;

      if (
        px < 0 ||
        py < 0 ||
        px >= png.width ||
        py >= png.height
      ) {
        continue;
      }

      const index =
        (png.width * py + px) * 4;

      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];
      const a = png.data[index + 3];

      if (a === 0) continue;

      const concentration =
        rgbToConcentration([r, g, b]);

      if (concentration !== null) {
        values.push(concentration);
      }
    }
  }

  const concentration = median(values);

  if (concentration === null) {
    throw new Error(
      'No valid AMSR2 concentration at vessel position'
    );
  }

  return {
    concentration,
    source: 'NASA GIBS / AMSR2',
    layer: AMSR2_LAYER,
    resolutionKm: 25,
    projection: 'EPSG:3031',
    sampledAt: new Date().toISOString(),
  };
}

export default sampleAMSR2SeaIce;