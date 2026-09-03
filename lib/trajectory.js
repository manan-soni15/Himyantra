// lib/trajectory.js
//
// Calculates iceberg movement and predicts future positions
// using historical USNIC observations.
//
// Coordinate system:
// Input  -> Latitude / Longitude (EPSG:4326)
// Work   -> Antarctic Polar Stereographic (EPSG:3031)
// Output -> Latitude / Longitude
//
// This is a baseline data-driven forecasting model.
// It uses the most recent observations to estimate movement.

import proj4 from "proj4";

// ---------------------------------------------------------
// Coordinate systems
// ---------------------------------------------------------

const WGS84 = "EPSG:4326";

const ANTARCTIC_PROJECTION =
    "+proj=stere " +
    "+lat_0=-90 " +
    "+lat_ts=-71 " +
    "+lon_0=0 " +
    "+k=1 " +
    "+x_0=0 " +
    "+y_0=0 " +
    "+datum=WGS84 " +
    "+units=m " +
    "+no_defs";

// ---------------------------------------------------------
// Convert latitude/longitude → Antarctic X/Y metres
// ---------------------------------------------------------

function latLonToXY(lat, lon) {
    const [x, y] = proj4(
        WGS84,
        ANTARCTIC_PROJECTION,
        [lon, lat]
    );

    return { x, y };
}

// ---------------------------------------------------------
// Convert Antarctic X/Y metres → latitude/longitude
// ---------------------------------------------------------

function xyToLatLon(x, y) {
    const [lon, lat] = proj4(
        ANTARCTIC_PROJECTION,
        WGS84,
        [x, y]
    );

    return {
        lat,
        lon,
    };
}

// ---------------------------------------------------------
// Convert date string → time in days
// ---------------------------------------------------------

function daysBetween(startDate, currentDate) {
    const start = new Date(startDate + "T00:00:00Z");
    const current = new Date(currentDate + "T00:00:00Z");

    return (
        (current.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );
}

// ---------------------------------------------------------
// Simple linear regression
//
// y = a + b*x
//
// Returns:
// slope     = movement per day
// intercept = starting value
// ---------------------------------------------------------

function linearRegression(points) {
    const n = points.length;

    if (n < 2) {
        return {
            slope: 0,
            intercept: points[0]?.y ?? 0,
        };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    }

    const denominator =
        n * sumXX - sumX * sumX;

    if (denominator === 0) {
        return {
            slope: 0,
            intercept: sumY / n,
        };
    }

    const slope =
        (n * sumXY - sumX * sumY) /
        denominator;

    const intercept =
        (sumY - slope * sumX) / n;

    return {
        slope,
        intercept,
    };
}

// ---------------------------------------------------------
// Predict iceberg trajectory
//
// history format:
//
// [
//     {
//         lat: -58.90,
//         lon: -51.01,
//         date: "2026-08-20"
//     },
//     ...
// ]
//
// forecastDays = number of days into the future
// recentObservations = number of recent observations
// used for calculating the trend
// ---------------------------------------------------------

export function predictTrajectory(
    history,
    forecastDays = 7,
    recentObservations = 5
) {
    // -----------------------------------------------------
    // Validate input
    // -----------------------------------------------------

    if (!Array.isArray(history) || history.length < 2) {
        return {
            historical: history || [],
            predicted: [],
            speedKmPerDay: 0,
            directionDegrees: 0,
        };
    }

    // -----------------------------------------------------
    // Remove invalid observations
    // -----------------------------------------------------

    const validHistory = history
        .filter((point) => {
            return (
                Number.isFinite(point.lat) &&
                Number.isFinite(point.lon) &&
                point.date
            );
        })
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    if (validHistory.length < 2) {
        return {
            historical: validHistory,
            predicted: [],
            speedKmPerDay: 0,
            directionDegrees: 0,
        };
    }

    // -----------------------------------------------------
    // Use only the most recent observations
    // -----------------------------------------------------

    const recentHistory =
        validHistory.slice(-recentObservations);

    // -----------------------------------------------------
    // Establish time reference
    // -----------------------------------------------------

    const firstDate =
        recentHistory[0].date;

    const latestDate =
        recentHistory[recentHistory.length - 1].date;

    // -----------------------------------------------------
    // Convert observations to EPSG:3031
    // -----------------------------------------------------

    const projected = recentHistory.map((point) => {
        const { x, y } = latLonToXY(
            point.lat,
            point.lon
        );

        return {
            date: point.date,
            time: daysBetween(
                firstDate,
                point.date
            ),
            x,
            y,
        };
    });

    // -----------------------------------------------------
    // Regression for X and Y movement
    // -----------------------------------------------------

    const xRegression = linearRegression(
        projected.map((point) => ({
            x: point.time,
            y: point.x,
        }))
    );

    const yRegression = linearRegression(
        projected.map((point) => ({
            x: point.time,
            y: point.y,
        }))
    );

    // -----------------------------------------------------
    // Velocity components in metres/day
    // -----------------------------------------------------

    const velocityX =
        xRegression.slope;

    const velocityY =
        yRegression.slope;

    // -----------------------------------------------------
    // Speed
    // -----------------------------------------------------

    const speedMetersPerDay =
        Math.sqrt(
            velocityX * velocityX +
            velocityY * velocityY
        );

    const speedKmPerDay =
        speedMetersPerDay / 1000;

    // -----------------------------------------------------
    // Direction
    //
    // 0° = North
    // 90° = East
    // 180° = South
    // 270° = West
    // -----------------------------------------------------

    let directionDegrees =
        Math.atan2(
            velocityX,
            velocityY
        ) *
        (180 / Math.PI);

    if (directionDegrees < 0) {
        directionDegrees += 360;
    }

    // -----------------------------------------------------
    // Current projected position
    // -----------------------------------------------------

    const latestProjected =
        projected[projected.length - 1];

    // -----------------------------------------------------
    // Generate predicted positions
    // -----------------------------------------------------

    const predicted = [];

    for (
        let day = 1;
        day <= forecastDays;
        day++
    ) {
        const futureTime =
            latestProjected.time + day;

        const predictedX =
            xRegression.intercept +
            xRegression.slope *
            futureTime;

        const predictedY =
            yRegression.intercept +
            yRegression.slope *
            futureTime;

        const { lat, lon } =
            xyToLatLon(
                predictedX,
                predictedY
            );

        const futureDate =
            new Date(
                new Date(
                    latestDate +
                    "T00:00:00Z"
                ).getTime() +
                day *
                24 *
                60 *
                60 *
                1000
            );

        const dateString =
            futureDate
                .toISOString()
                .split("T")[0];

        predicted.push({
            lat,
            lon,
            date: dateString,
            day,
        });
    }

    // -----------------------------------------------------
    // Return everything needed by the map
    // -----------------------------------------------------

    return {
        historical: validHistory,

        predicted,

        speedKmPerDay,

        directionDegrees,

        velocityX,
        velocityY,

        observationsUsed:
            recentHistory.length,

        lastObservedDate:
            latestDate,
    };
}