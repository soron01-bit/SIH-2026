import React from 'react';

export const StatCard = ({
  label,
  value,
  unit,
  subtext,
  context,
  icon: Icon,
  trend,
  accent = 'slate',
  badge,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#0c1220] border border-slate-800 rounded-lg p-4 shadow-sm transition-colors hover:border-slate-700 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-400">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {Icon && (
            <div className="p-2 rounded bg-slate-850 text-slate-400 border border-slate-800">
              <Icon className="w-4 h-4" />
            </div>
          )}
          {badge}
        </div>
      </div>

      {(subtext || context || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
          {subtext && (
            <div className="text-xs font-medium text-slate-300 flex items-center justify-between">
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
          {context && (
            <p className="text-[11px] text-slate-400 leading-snug">
              {context}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
