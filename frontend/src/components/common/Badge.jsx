import React from 'react';

const VARIANT_STYLES = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  neutral: 'bg-slate-850 text-slate-300 border-slate-800',
  cyan: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
  emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  safe: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  amber: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  watch: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  orange: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
  warning: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
  rose: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  danger: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  purple: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
};

const SEVERITY_MAP = {
  LOW: 'safe',
  MODERATE: 'watch',
  HIGH: 'warning',
  EXTREME: 'danger',
};

export const Badge = ({ children, variant = 'default', severity, size = 'md', className = '' }) => {
  const chosenVariant = severity ? (SEVERITY_MAP[severity] || 'default') : variant;
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${sizeStyles} ${VARIANT_STYLES[chosenVariant] || VARIANT_STYLES.default} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
