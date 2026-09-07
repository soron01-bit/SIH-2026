import React from 'react';

const STATUS_COLORS = {
  active: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
  warning: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
  danger: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
  standby: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]',
  offline: 'bg-slate-500 shadow-[0_0_8px_#64748b]',
};

export const StatusIndicator = ({ status = 'active', label, pulse = true, className = '' }) => {
  const dotColor = STATUS_COLORS[status] || STATUS_COLORS.active;

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-mono text-slate-300 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
};

export default StatusIndicator;
