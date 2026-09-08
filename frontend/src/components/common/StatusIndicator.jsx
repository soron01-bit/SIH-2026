import React from 'react';

const STATUS_COLORS = {
  active: 'bg-emerald-500',
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  standby: 'bg-sky-500',
  offline: 'bg-slate-500',
};

export const StatusIndicator = ({ status = 'active', label, pulse = false, className = '' }) => {
  const dotColor = STATUS_COLORS[status] || STATUS_COLORS.active;

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-mono text-slate-300 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
};

export default StatusIndicator;
