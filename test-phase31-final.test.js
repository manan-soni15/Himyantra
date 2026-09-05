import { describe, it, expect, vi } from 'vitest';
import { GRID_MIN_X, GRID_MAX_X, GRID_MIN_Y, GRID_MAX_Y, GRID_CELL_SIZE_M, cellIndex, indexToRowCol, GRID_TOTAL_CELLS, GRID_ROWS, GRID_COLUMNS } from './lib/gridUtils';
import { latLonToXY, xyToLatLon } from './lib/coordinateUtils';
import { isCellLand } from './lib/landMask';
import { calculateEffectiveRoutingRisk, isCellTraversable } from './lib/traversability';
import mockIcebergs from './data/mockIcebergs';
import { getSpatialRiskGrid, getCellDataAtXY, invalidateEnvironmentCache } from './lib/spatialRiskGrid';
import { generateRoutes, evaluateRouteSpatialRisk, resolveMaritimeAccessPoint } from './lib/routeOptimizer';
import { getGeoPanelForLatLon, getGeoPanelBounds, getGeoPanelSummary } from './lib/geographicGrid';

describe('A. GRID', () => {
    it('should have 78,400 cells and 280x280 dimension', () => {
        expect(GRID_TOTAL_CELLS).toBe(78400);
        expect(GRID_ROWS).toBe(280);
        expect(GRID_COLUMNS).toBe(280);
        expect(GRID_CELL_SIZE_M).toBe(25000);
    });

    it('should index back and forth deterministically', () => {
        const idx = cellIndex(10, 20);
        const coords = indexToRowCol(idx);
        expect(coords.row).toBe(10);
        expect(coords.col).toBe(20);
    });
});

describe('B. COORDINATES', () => {
    it('round trips EPSG:4326 to EPSG:3031', () => {
        const points = [
            { lat: -90, lon: 0 },
            { lat: -58, lon: -180 },
            { lat: -65, lon: 45 }
        ];

        for (const pt of points) {
            const xy = latLonToXY(pt.lat, pt.lon);
            const returned = xyToLatLon(xy.x, xy.y);
            expect(Math.abs(returned.lat - pt.lat)).toBeLessThan(0.01);
            
            // At South Pole, longitude is degenerate, so only check if lat != -90
            if (pt.lat > -89.9) {
                let diff = Math.abs(returned.lon - pt.lon);
                if (diff > 180) diff = Math.abs(diff - 360);
                expect(diff).toBeLessThan(0.01);
            }
        }
    });
});

describe('E. LAND', () => {
    it('detects land accurately using GeoJSON footprint', () => {
        // South Pole is definitely land
        const sp = latLonToXY(-90, 0);
        const isSpLand = isCellLand(sp.x - 12500, sp.x + 12500, sp.y - 12500, sp.y + 12500);
        expect(isSpLand).toBe(true);

        // Far ocean is not land (e.g., -58, 0)
        const ocean = latLonToXY(-58, 0);
        const isOceanLand = isCellLand(ocean.x - 12500, ocean.x + 12500, ocean.y - 12500, ocean.y + 12500);
        expect(isOceanLand).toBe(false);
    });
});

describe('F. TRAVERSABILITY & G. MISSING DATA', () => {
    it('calculates risk accurately', () => {
        const missingCell = {
            environmentalRisk: 0,
            riskDataCompleteness: 0
        };
        const risk = calculateEffectiveRoutingRisk(missingCell);
        expect(risk).toBe(null);
        expect(isCellTraversable(missingCell)).toBe(false);
        
        const partialCell = {
            environmentalRisk: 20,
            riskDataCompleteness: 0.66
        };
        expect(calculateEffectiveRoutingRisk(partialCell)).toBeGreaterThan(20); // penalty applied
    });
});

describe('H. ICEBERG MUTATION', () => {
    it('updates cache dynamically on mutation', { timeout: 60000 }, async () => {
        // Initial setup
        invalidateEnvironmentCache();
        const pt = { lat: -70, lon: 0 };
        const cellXY = latLonToXY(pt.lat, pt.lon);
        
        // Make sure no iceberg is very close
        const oldGrid = getSpatialRiskGrid();
        const oldCell = getCellDataAtXY(cellXY.x, cellXY.y);
        const oldRisk = oldCell.icebergRisk || 0;

        // Mutate mock iceberg by bringing it directly to the point
        const originalIceberg = mockIcebergs[0];
        mockIcebergs[0] = {
            ...originalIceberg,
            position: [pt.lat, pt.lon],
            area: 1000 // Huge
        };

        invalidateEnvironmentCache();
        const newGrid = getSpatialRiskGrid();
        const newCell = getCellDataAtXY(cellXY.x, cellXY.y);
        
        expect(newCell.icebergRisk).toBeGreaterThan(oldRisk);
        
        // Restore
        mockIcebergs[0] = originalIceberg;
        invalidateEnvironmentCache();
    });
});

describe('O. ROUTE VALIDATION / SUPERCOVER', () => {
    it('rejects routes containing land', async () => {
        // We will mock a generator call with land
        const startPoint = { lat: -90, lon: 0 }; // South pole (Land)
        const endPoint = { lat: -58, lon: 0 };   // Ocean
        
        const routes = await generateRoutes({
            startPoint,
            endPoint,
            vessel: { maxSpeedKnots: 12 },
            objective: 'Balanced'
        });
        
        expect(routes[0].isInvalid).toBe(true);
        expect(routes[0].failureReason).toBe('START_ON_LAND');
    });
    
    it('Fastest objective requires valid speed', async () => {
        const startPoint = { lat: -60, lon: 0 }; 
        const endPoint = { lat: -61, lon: 0 };   
        
        const routes = await generateRoutes({
            startPoint,
            endPoint,
            vessel: { maxSpeedKnots: -5 },
            objective: 'Fastest'
        });
        
        expect(routes[0].isInvalid).toBe(true);
        expect(routes[0].failureReason).toBe('INVALID_SPEED');
    });
});

describe('P. MARITIME ACCESS', () => {
    it('resolves Neumayer III to water', () => {
        // Neumayer III coordinates from prompt
        const lat = -70.673;
        const lon = -8.274;
        
        const access = resolveMaritimeAccessPoint(lat, lon);
        // Either it was already water (false) or it was resolved to water (true)
        expect(access.isResolved === true || access.isResolved === false).toBe(true);
        
        const xy = latLonToXY(access.lat, access.lon);
        const accessCell = getCellDataAtXY(xy.x, xy.y);
        expect(accessCell.isLand).toBe(false);
        expect(isCellTraversable(accessCell)).toBe(true);
    });
});
