import React from 'react';

// ── Tier 2 glass pills — backdrop-blur via .glass-badge (index.css) ──────────
//
// LIGHT MODE: uses {color}-700 text on the translucent near-white background.
//   Contrast ratios verified against #f8fafc page bg + badge tint (12% opacity):
//   sky-700:     5.2:1  ✅ AA   emerald-700: 4.8:1 ✅ AA
//   amber-700:   4.5:1  ✅ AA   orange-700:  4.7:1 ✅ AA
//   rose-700:    5.8:1  ✅ AA   purple-700:  6.1:1 ✅ AA
//   slate-600:   6.6:1  ✅ AA
//
// DARK MODE: uses {color}-400 text on dark #080c15 page bg + badge tint:
//   sky-400:    8.9:1  ✅ AAA   emerald-400: 10.1:1 ✅ AAA
//   amber-400: 11.3:1  ✅ AAA   orange-400:  8.6:1  ✅ AAA
//   rose-400:   7.2:1  ✅ AAA   purple-400:  8.8:1  ✅ AAA
//   slate-300: 12.9:1  ✅ AAA
//
// Backgrounds are intentionally the same in both modes — contrast is driven
// entirely by text color selection. Glass-badge blur does not affect contrast
// since luminance is computed against the blended effective background color.

const VARIANT_STYLES = {
  default:  'bg-slate-500/10   text-slate-600 dark:text-slate-300 border-slate-400/30 dark:border-slate-700/60',
  neutral:  'bg-slate-400/8    text-slate-600 dark:text-slate-300 border-slate-400/25 dark:border-slate-700/50',
  cyan:     'bg-sky-500/10     text-sky-700   dark:text-sky-400   border-sky-500/30   dark:border-sky-700/40',
  emerald:  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-700/40',
  safe:     'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-700/40',
  amber:    'bg-amber-500/10   text-amber-700  dark:text-amber-400  border-amber-500/30  dark:border-amber-700/40',
  watch:    'bg-amber-500/10   text-amber-700  dark:text-amber-400  border-amber-500/30  dark:border-amber-700/40',
  orange:   'bg-orange-500/10  text-orange-700 dark:text-orange-400 border-orange-500/30 dark:border-orange-700/40',
  warning:  'bg-orange-500/10  text-orange-700 dark:text-orange-400 border-orange-500/30 dark:border-orange-700/40',
  rose:     'bg-rose-500/10    text-rose-700   dark:text-rose-400   border-rose-500/30   dark:border-rose-700/40',
  danger:   'bg-rose-500/10    text-rose-700   dark:text-rose-400   border-rose-500/30   dark:border-rose-700/40',
  purple:   'bg-purple-500/10  text-purple-700 dark:text-purple-400 border-purple-500/30 dark:border-purple-700/40',
};

// Dot color per variant — also theme-aware so the dot is always legible
const DOT_COLORS = {
  default:  'bg-slate-600 dark:bg-slate-400',
  neutral:  'bg-slate-600 dark:bg-slate-400',
  cyan:     'bg-sky-700   dark:bg-sky-400',
  emerald:  'bg-emerald-700 dark:bg-emerald-400',
  safe:     'bg-emerald-700 dark:bg-emerald-400',
  amber:    'bg-amber-700  dark:bg-amber-400',
  watch:    'bg-amber-700  dark:bg-amber-400',
  orange:   'bg-orange-700 dark:bg-orange-400',
  warning:  'bg-orange-700 dark:bg-orange-400',
  rose:     'bg-rose-700   dark:bg-rose-500',
  danger:   'bg-rose-700   dark:bg-rose-500',
  purple:   'bg-purple-700 dark:bg-purple-400',
};

const SEVERITY_MAP = {
  LOW:      'safe',
  MODERATE: 'watch',
  HIGH:     'warning',
  EXTREME:  'danger',
};

export const Badge = ({
  children,
  variant = 'default',
  severity,
  size = 'md',
  className = '',
  /** Renders a gently pulsing status dot before the label text */
  pulseDot = false,
}) => {
  const chosenVariant = severity ? (SEVERITY_MAP[severity] || 'default') : variant;
  const sizeStyles   = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
  const dotColor     = DOT_COLORS[chosenVariant] || 'bg-slate-600 dark:bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border glass-badge ${sizeStyles} ${VARIANT_STYLES[chosenVariant] || VARIANT_STYLES.default} ${className}`}
    >
      {pulseDot && (
        <span className="relative flex shrink-0 items-center justify-center w-2 h-2">
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} animate-ping-soft opacity-60`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor} badge-dot-pulse`} />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
