// lib/dataNormalizer.js
// Normalization layer for Himyantra inputs.
// Ensures consistent coordinate structure, unit mapping, and fallback behavior.

import { isValidLatLon } from './coordinateUtils.js';

/**
 * Normalizes a Vessel object.
 * Missing required fields trigger warnings and defaults.
 * @param {Object} vessel 
 */
export function normalizeVessel(vessel) {
    if (!vessel) return null;

    let normalizedPos = null;
    if (Array.isArray(vessel.currentPosition) && vessel.currentPosition.length === 2) {
        if (isValidLatLon(vessel.currentPosition[0], vessel.currentPosition[1])) {
            normalizedPos = [vessel.currentPosition[0], vessel.currentPosition[1]];
        } else {
            console.warn(`[DataNormalizer] Vessel ${vessel.id} has invalid coordinates.`);
        }
    }

    return {
        ...vessel,
        // Enforce required fields
        id: vessel.id || "UNKNOWN_VESSEL",
        name: vessel.name || "Unknown Vessel",
        currentPosition: normalizedPos,
        
        // Optional numerical telemetry defaults to null if missing or invalid
        maxSpeedKnots: Number.isFinite(vessel.maxSpeedKnots) ? vessel.maxSpeedKnots : null,
        draftMeters: Number.isFinite(vessel.draftMeters) ? vessel.draftMeters : null,
        displacementTons: Number.isFinite(vessel.displacementTons) ? vessel.displacementTons : null,
        fuelCapacityTons: Number.isFinite(vessel.fuelCapacityTons) ? vessel.fuelCapacityTons : null,
        
        status: vessel.status || "Unknown",
        iceClass: vessel.iceClass || "UNCLASSED",
    };
}

/**
 * Normalizes an Iceberg object.
 * @param {Object} iceberg 
 */
export function normalizeIceberg(iceberg) {
    if (!iceberg) return null;

    let normalizedPos = null;
    if (Array.isArray(iceberg.position) && iceberg.position.length === 2) {
        if (isValidLatLon(iceberg.position[0], iceberg.position[1])) {
            normalizedPos = [iceberg.position[0], iceberg.position[1]];
        }
    }

    // If iceberg has no valid position, we return null to completely omit it from risk arrays.
    if (!normalizedPos) {
        console.warn(`[DataNormalizer] Dropping iceberg ${iceberg.id} due to missing/invalid coordinates.`);
        return null;
    }

    let normalizedHistory = [];
    if (Array.isArray(iceberg.history)) {
        normalizedHistory = iceberg.history.filter(point => {
            return isValidLatLon(point.lat, point.lon) && point.date && !Number.isNaN(Date.parse(point.date));
        });
    }

    return {
        ...iceberg,
        id: iceberg.id || `UNKNOWN_ICEBERG_${Math.random()}`,
        name: iceberg.name || "Unknown Iceberg",
        position: normalizedPos,
        // Missing area becomes null (excluded from calculations, rather than arbitrarily defaulting to 1)
        area: Number.isFinite(iceberg.area) ? iceberg.area : null,
        status: iceberg.status || "Unknown",
        history: normalizedHistory,
    };
}

/**
 * Normalizes Weather data.
 * @param {Object} weather 
 */
export function normalizeWeather(weather) {
    if (!weather) return null;

    return {
        ...weather,
        region: weather.region || "Unknown Region",
        windSpeedKnots: Number.isFinite(weather.windSpeedKnots) ? weather.windSpeedKnots : null,
        windDirectionDegrees: Number.isFinite(weather.windDirectionDegrees) ? weather.windDirectionDegrees : null,
        uWindMetersPerSec: Number.isFinite(weather.uWindMetersPerSec) ? weather.uWindMetersPerSec : null,
        vWindMetersPerSec: Number.isFinite(weather.vWindMetersPerSec) ? weather.vWindMetersPerSec : null,
        airTempCelsius: Number.isFinite(weather.airTempCelsius) ? weather.airTempCelsius : null,
        seaSurfaceTempCelsius: Number.isFinite(weather.seaSurfaceTempCelsius) ? weather.seaSurfaceTempCelsius : null,
        mslPressureHpa: Number.isFinite(weather.mslPressureHpa) ? weather.mslPressureHpa : null,
        visibilityNauticalMiles: Number.isFinite(weather.visibilityNauticalMiles) ? weather.visibilityNauticalMiles : null,
        waveHeightMeters: Number.isFinite(weather.waveHeightMeters) ? weather.waveHeightMeters : null,
        severityIndex: Number.isFinite(weather.severityIndex) ? weather.severityIndex : null,
    };
}

/**
 * Normalizes a Sea Ice cell/forecast data.
 * @param {Object} seaIceData 
 */
export function normalizeSeaIce(seaIceData) {
    if (!seaIceData) return null;
    
    let conc = null;
    if (Number.isFinite(seaIceData.concentration)) {
        conc = Math.max(0, Math.min(100, seaIceData.concentration));
    }

    return {
        ...seaIceData,
        concentration: conc,
        lat: Number.isFinite(seaIceData.lat) ? seaIceData.lat : null,
        lon: Number.isFinite(seaIceData.lon) ? seaIceData.lon : null,
    };
}
