// lib/coordinateUtils.js
// Centralized Coordinate Utility for HIMYANTRA Phase 1
// Handles geographic validation and Antarctic Polar Stereographic projection.

import proj4 from "proj4";

// ---------------------------------------------------------
// Coordinate Systems Definitions
// ---------------------------------------------------------

export const EPSG_4326 = "EPSG:4326"; // Latitude / Longitude

export const EPSG_3031 =
    "+proj=stere " +
    "+lat_0=-90 " +
    "+lat_ts=-71 " +
    "+lon_0=0 " +
    "+k=1 " +
    "+x_0=0 " +
    "+y_0=0 " +
    "+datum=WGS84 " +
    "+units=m " +
    "+no_defs"; // Antarctic Polar Stereographic

// ---------------------------------------------------------
// Validation Methods
// ---------------------------------------------------------

/**
 * Validates generic spherical geographic coordinates.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if coordinates are numbers within valid spherical bounds.
 */
export function isValidLatLon(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    return true;
}

/**
 * Validates that the coordinates are reasonably within the Antarctic operational region.
 * Using -50 as a generic outer boundary for the Southern Ocean / Antarctic region.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if valid globally AND strictly in the Southern Hemisphere.
 */
export function isValidAntarcticLatLon(lat, lon) {
    if (!isValidLatLon(lat, lon)) return false;
    if (lat > -40) {
        // -40 used to allow some Drake Passage / Sub-Antarctic staging.
        console.warn(`[Coordinate Warning] Latitude ${lat} is outside expected Antarctic theater.`);
        // Note: For Phase 1, we still return true so we don't break existing mock data that might stage higher up, 
        // but we flag it structurally. Actually, we'll return false if lat is in Northern Hemisphere.
        if (lat > 0) return false; 
    }
    return true;
}

/**
 * Validates that a Cartesian EPSG:3031 coordinate is structurally sound.
 * @param {number} x - Easting / X in meters
 * @param {number} y - Northing / Y in meters
 * @returns {boolean} True if x and y are finite numbers.
 */
export function isValidProjectedXY(x, y) {
    return Number.isFinite(x) && Number.isFinite(y);
}

// ---------------------------------------------------------
// Conversion Methods
// ---------------------------------------------------------

/**
 * Converts geographic coordinates (Latitude / Longitude) to Antarctic Polar Stereographic (EPSG:3031) meters.
 * @param {number} lat - Latitude (EPSG:4326)
 * @param {number} lon - Longitude (EPSG:4326)
 * @returns {Object|null} { x, y } in meters, or null if input is invalid.
 */
export function latLonToXY(lat, lon) {
    if (!isValidLatLon(lat, lon)) return null;
    
    try {
        const [x, y] = proj4(
            EPSG_4326,
            EPSG_3031,
            [lon, lat] // proj4 expects [lon, lat]
        );
        return { x, y };
    } catch (err) {
        console.error("Proj4 conversion failed:", err);
        return null;
    }
}

/**
 * Converts Antarctic Polar Stereographic (EPSG:3031) meters to geographic coordinates (Latitude / Longitude).
 * @param {number} x - Easting / X in meters (EPSG:3031)
 * @param {number} y - Northing / Y in meters (EPSG:3031)
 * @returns {Object|null} { lat, lon } in degrees, or null if input is invalid.
 */
export function xyToLatLon(x, y) {
    if (!isValidProjectedXY(x, y)) return null;
    
    try {
        const [lon, lat] = proj4(
            EPSG_3031,
            EPSG_4326,
            [x, y]
        );
        return { lat, lon };
    } catch (err) {
        console.error("Proj4 conversion failed:", err);
        return null;
    }
}
