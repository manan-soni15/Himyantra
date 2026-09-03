"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

const forecastData = [
  {
    time: "Now",
    observed: 72,
    forecast: null,
    low: null,
    high: null,
  },
  {
    time: "+6h",
    observed: 73,
    forecast: 74,
    low: 70,
    high: 78,
  },
  {
    time: "+12h",
    observed: null,
    forecast: 76,
    low: 72,
    high: 80,
  },
  {
    time: "+24h",
    observed: null,
    forecast: 79,
    low: 75,
    high: 83,
  },
  {
    time: "+36h",
    observed: null,
    forecast: 82,
    low: 77,
    high: 87,
  },
  {
    time: "+48h",
    observed: null,
    forecast: 84,
    low: 79,
    high: 89,
  },
];

export default function SeaIceForecastChart() {
  return (
    <div className="w-full h-full flex flex-col">

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecastData}
            margin={{
              top: 20,
              right: 20,
              left: 5,
              bottom: 5,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.12)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
              }}
              axisLine={{
                stroke: "rgba(148,163,184,0.2)",
              }}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              width={45}
            />

            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid rgba(34,211,238,0.35)",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value, name) => {
                if (value === null || value === undefined) {
                  return ["-", name];
                }

                return [`${value}%`, name];
              }}
            />

            {/* Prediction confidence range */}
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="rgba(34,211,238,0.10)"
              activeDot={false}
              legendType="none"
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#22d3ee"
              strokeWidth={3}
              strokeDasharray="7 5"
              dot={{
                r: 4,
                fill: "#22d3ee",
              }}
              activeDot={{
                r: 6,
              }}
            />

            {/* Observed line */}
            <Line
              type="monotone"
              dataKey="observed"
              name="Observed"
              stroke="#f8fafc"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#f8fafc",
              }}
              activeDot={{
                r: 6,
              }}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-3 text-xs text-slate-400">

        <div className="flex items-center gap-2">
          <span
            className="w-6 h-[3px] rounded"
            style={{ background: "#f8fafc" }}
          />
          Observed
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-6 border-t-2 border-dashed"
            style={{ borderColor: "#22d3ee" }}
          />
          Forecast
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-6 h-3 rounded"
            style={{ background: "rgba(34,211,238,0.12)" }}
          />
          Confidence Range
        </div>

      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 px-4 pb-4">

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Current
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            72%
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            24h Forecast
          </div>
          <div className="mt-1 text-lg font-semibold text-cyan-400">
            79%
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            48h Forecast
          </div>
          <div className="mt-1 text-lg font-semibold text-cyan-400">
            84%
          </div>
        </div>

      </div>

      {/* Data source */}
      <div className="px-4 pb-3 text-[10px] text-slate-500">
        Baseline forecast • Satellite observation: AMSR2 • 25 km resolution
      </div>

    </div>
  );
}