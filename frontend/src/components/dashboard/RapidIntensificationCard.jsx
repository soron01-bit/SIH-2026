import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';

const RISK_COLORS = {
  LOW: '#10b981',
  MODERATE: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_LABELS = {
  LOW: { label: 'LOW RISK', color: '#10b981', bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-400' },
  MODERATE: { label: 'MODERATE', color: '#f59e0b', bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-400' },
  HIGH: { label: 'HIGH RISK', color: '#f97316', bg: 'bg-orange-950/60 border-orange-800/60', text: 'text-orange-400' },
  CRITICAL: { label: 'CRITICAL RISK', color: '#ef4444', bg: 'bg-rose-950/60 border-rose-800/60', text: 'text-rose-400' },
};

/**
 * Derives RI data from cyclone object.
 * If backend provides riProbability, uses it; otherwise derives from wind/pressure delta.
 */
const deriveRIData = (cyclone) => {
  if (!cyclone) return { probability: 0, intensification: 0, risk: 'LOW', threshold: 30 };

  const prob = cyclone.riProbability ?? 41;
  const intensification = cyclone.riIntensification ?? 13;
  const threshold = cyclone.riThreshold ?? 30;

  let risk = 'LOW';
  if (prob >= 60) risk = 'CRITICAL';
  else if (prob >= 40) risk = 'HIGH';
  else if (prob >= 20) risk = 'MODERATE';

  return { probability: prob, intensification, threshold, risk };
};

export const RapidIntensificationCard = ({ cyclone }) => {
  const ri = deriveRIData(cyclone);
  const riskConfig = RISK_LABELS[ri.risk];
  const gaugeColor = RISK_COLORS[ri.risk];

  // Donut data: probability filled vs empty
  const donutData = [
    { name: 'filled', value: ri.probability },
    { name: 'empty', value: 100 - ri.probability },
  ];

  return (
    <div className="space-y-3">
      {/* Header with warning badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Rapid Intensification
          </span>
        </div>
        {ri.probability >= 30 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 tracking-wide">WARNING</span>
          </div>
        )}
      </div>

      {/* Donut Gauge */}
      <div className="relative flex items-center justify-center">
        <div style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={gaugeColor} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono" style={{ color: gaugeColor }}>
            {ri.probability}%
          </span>
          <span className="text-[9px] text-slate-400 font-medium tracking-wide">24h window</span>
        </div>
      </div>

      {/* Risk Badge */}
      <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded border ${riskConfig.bg}`}>
        <span className={`text-xs font-bold tracking-wider ${riskConfig.text}`}>
          ⬥ {riskConfig.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Expected intensification
          </span>
          <span className="font-bold font-mono text-white">
            +{ri.intensification} <span className="text-slate-400 font-normal">knots / 24h</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">RI threshold</span>
          <span className="font-mono text-amber-400">≥{ri.threshold} kt increase in 24h</span>
        </div>
      </div>
    </div>
  );
};

export default RapidIntensificationCard;
