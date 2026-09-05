'use client';

import { useMemo } from 'react';
import { Polyline, LayerGroup } from 'react-leaflet';

export default function GraticuleLayer({ visible = true }) {
  const graticuleLines = useMemo(() => {
    const lines = [];

    // Latitudes: -50, -60, -70, -80
    const lats = [-50, -60, -70, -80];
    lats.forEach(lat => {
      const latLine = [];
      // Generate points every 2 degrees of longitude to form a smooth curve
      for (let lon = -180; lon <= 180; lon += 2) {
        latLine.push([lat, lon]);
      }
      lines.push({ positions: latLine, label: `${Math.abs(lat)}°S` });
    });

    // Longitudes: Every 30 degrees
    const lons = [];
    for (let l = -180; l < 180; l += 30) {
      lons.push(l);
    }
    
    lons.forEach(lon => {
      const lonLine = [];
      // Generate points from -45 to -90
      for (let lat = -45; lat >= -90; lat -= 2) {
        lonLine.push([lat, lon]);
      }
      lines.push({ positions: lonLine, label: `${Math.abs(lon)}°${lon < 0 ? 'W' : (lon > 0 ? 'E' : '')}` });
    });

    return lines;
  }, []);

  if (!visible) return null;

  return (
    <LayerGroup>
      {graticuleLines.map((line, idx) => (
        <Polyline
          key={`graticule-${idx}`}
          positions={line.positions}
          pathOptions={{
            color: '#64748b', // slate-500
            weight: 1,
            opacity: 0.3,
            dashArray: '4 4'
          }}
          interactive={false}
        />
      ))}
    </LayerGroup>
  );
}
