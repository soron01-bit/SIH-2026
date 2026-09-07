import React from 'react';

const VARIANT_STYLES = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
};

const SEVERITY_MAP = {
  LOW: 'emerald',
  MODERATE: 'amber',
  HIGH: 'rose',
  EXTREME: 'red',
};

export const Badge = ({ children, variant = 'default', severity, size = 'md', className = '' }) => {
  const chosenVariant = severity ? (SEVERITY_MAP[severity] || 'default') : variant;
  const sizeStyles = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles} ${VARIANT_STYLES[chosenVariant] || VARIANT_STYLES.default} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
