import React from 'react';

export const StatCard = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  trend, // { direction: 'up' | 'down' | 'neutral', text: string }
  accent = 'cyan', // 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple'
  badge,
  className = '',
}) => {
  const accentColors = {
    cyan: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-400',
    purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-400',
  };

  const currentAccent = accentColors[accent] || accentColors.cyan;

  return (
    <div
      className={`relative overflow-hidden bg-meteor-900/90 border border-meteor-border rounded-xl p-5 shadow-lg transition-all duration-200 hover:border-slate-600 ${className}`}
    >
      <div className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${currentAccent} rounded-full blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 font-mono">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Icon className="w-5 h-5" />
            </div>
          )}
          {badge}
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-3 border-t border-meteor-border/60 flex items-center justify-between text-xs text-slate-400">
          <span>{subtext}</span>
          {trend && (
            <span
              className={`font-mono text-xs ${
                trend.direction === 'up'
                  ? 'text-rose-400'
                  : trend.direction === 'down'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
