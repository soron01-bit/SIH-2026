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
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl text-xs font-mono">
        <div className="text-cyan-400 font-bold mb-1 border-b border-slate-800 pb-1">
          {label} ({dataPoint.stage || 'Track Observation'})
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Sustained Wind:
            </span>
            <span className="text-white font-bold">{dataPoint.windSpeed} kt</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Central Pressure:
            </span>
            <span className="text-white font-bold">{dataPoint.pressure} hPa</span>
          </div>
          {dataPoint.classification && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              {dataPoint.classification}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const IntensityChart = ({ cyclone, height = 280 }) => {
  if (!cyclone) return null;

  // Transform historical and forecast track points into sequential chart data
  const historical = (cyclone.historicalTrack || []).map((pt, idx) => ({
    time: new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
    windSpeed: pt.windSpeedKnots,
    pressure: pt.pressureHpa,
    stage: 'Historical Observation',
    classification: pt.classification,
  }));

  const current = [{
    time: 'Now (Eye)',
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
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Intensity Evolution (Wind Speed vs Central Pressure)</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f2f4a" opacity={0.6} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              fontFamily="JetBrains Mono"
            />

            {/* Left Axis: Wind Speed (kt) */}
            <YAxis
              yAxisId="left"
              domain={[10, 130]}
              stroke="#06b6d4"
              fontSize={10}
              tickLine={false}
              fontFamily="JetBrains Mono"
              label={{ value: 'Wind (kt)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10 }}
            />

            {/* Right Axis: Central Pressure (hPa) inverted scale */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[920, 1015]}
              stroke="#f59e0b"
              fontSize={10}
              tickLine={false}
              fontFamily="JetBrains Mono"
              label={{ value: 'Pressure (hPa)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }}
            />

            {/* Wind Speed Area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="windSpeed"
              name="Max Sustained Wind (kt)"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#windGradient)"
            />

            {/* Barometric Pressure Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pressure"
              name="Central Pressure (hPa)"
              stroke="#f59e0b"
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
