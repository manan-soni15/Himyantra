import { antarcticaGeoJSON } from '../data/antarcticaLand';
import { latLonToXY } from './coordinateUtils';

let projectedPolygons = null;

function getProjectedPolygons() {
    if (projectedPolygons) return projectedPolygons;

    projectedPolygons = [];
    const geom = antarcticaGeoJSON.geometry;
    
    // Support both Polygon and MultiPolygon
    const coords = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

    for (const polygon of coords) {
        // polygon[0] is exterior ring
        const ring = polygon[0];
        const projRing = ring.map(pt => {
            const res = latLonToXY(pt[1], pt[0]); // [lat, lon] because GeoJSON is [lon, lat]
            return res ? [res.x, res.y] : null;
        }).filter(pt => pt !== null);
        
        projectedPolygons.push(projRing);
    }

    return projectedPolygons;
}

/**
 * Standard ray-casting algorithm for 2D cartesian coordinates.
 */
function pointInPolygon(point, polygon) {
    const x = point[0], y = point[1];
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

function isPointOnLand(x, y) {
    const polys = getProjectedPolygons();
    for (const poly of polys) {
        if (pointInPolygon([x, y], poly)) {
            return true;
        }
    }
    return false;
}

/**
 * A grid cell is considered non-navigable if its cell footprint intersects land.
 * We test the 4 corners, 4 mid-edges, and center (9 points).
 * If any point is on land, the cell intersects land.
 */
export function isCellLand(minX, maxX, minY, maxY) {
    const points = [
        [minX, minY], // BL
        [maxX, minY], // BR
        [maxX, maxY], // TR
        [minX, maxY], // TL
        [(minX + maxX) / 2, (minY + maxY) / 2], // Center
        [(minX + maxX) / 2, minY], // Bottom mid
        [(minX + maxX) / 2, maxY], // Top mid
        [minX, (minY + maxY) / 2], // Left mid
        [maxX, (minY + maxY) / 2], // Right mid
    ];

    for (const pt of points) {
        if (isPointOnLand(pt[0], pt[1])) return true;
    }
    return false;
}
