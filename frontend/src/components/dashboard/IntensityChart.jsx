import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded p-2.5 shadow-md text-xs font-sans">
        <div className="text-white font-semibold mb-1 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
          <span>{label}</span>
          <span className="text-slate-400 font-normal text-[11px]">{dataPoint.stage}</span>
        </div>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="text-sky-400">Wind Speed:</span>
            <span className="text-white font-bold">{dataPoint.windSpeed} kt ({Math.round(dataPoint.windSpeed * 1.852)} km/h)</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="text-amber-400">Pressure:</span>
            <span className="text-white font-bold">{dataPoint.pressure} hPa</span>
          </div>
          {dataPoint.classification && (
            <div className="text-[11px] text-slate-400 pt-1 font-sans">
              Stage: <strong className="text-slate-200">{dataPoint.classification}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const IntensityChart = ({ cyclone, height = 260 }) => {
  if (!cyclone) return null;

  // Transform historical and forecast track points into sequential chart data
  const historical = (cyclone.historicalTrack || []).map((pt) => ({
    time: new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
    windSpeed: pt.windSpeedKnots,
    pressure: pt.pressureHpa,
    stage: 'Historical Observation',
    classification: pt.classification,
  }));

  const current = [{
    time: 'Current Eye',
    windSpeed: cyclone.windSpeedKnots,
    pressure: cyclone.pressureHpa,
    stage: 'Current Detection',
    classification: cyclone.classification,
  }];

  const forecast = (cyclone.forecastTrack || []).map((fc) => ({
    time: `${fc.forecastHour} (${new Date(fc.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
    windSpeed: fc.windSpeedKnots,
    pressure: fc.pressureHpa,
    stage: 'Model Forecast',
    classification: fc.classification,
  }));

  const chartData = [...historical, ...current, ...forecast];

  return (
    <div className="w-full">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              fontFamily="Inter, sans-serif"
            />

            {/* Left Axis: Wind Speed (kt) */}
            <YAxis
              yAxisId="left"
              domain={[10, 130]}
              stroke="#0284c7"
              fontSize={11}
              tickLine={false}
              fontFamily="JetBrains Mono, monospace"
              label={{ value: 'Wind (kt)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }}
            />

            {/* Right Axis: Central Pressure (hPa) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[920, 1015]}
              stroke="#d97706"
              fontSize={11}
              tickLine={false}
              fontFamily="JetBrains Mono, monospace"
              label={{ value: 'Pressure (hPa)', angle: 90, position: 'insideRight', fill: '#fbbf24', fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter, sans-serif', paddingTop: '8px' }}
            />

            {/* Wind Speed Area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="windSpeed"
              name="Max Sustained Wind (kt)"
              stroke="#0284c7"
              strokeWidth={2}
              fill="#0284c7"
              fillOpacity={0.12}
            />

            {/* Barometric Pressure Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pressure"
              name="Central Pressure (hPa)"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IntensityChart;
