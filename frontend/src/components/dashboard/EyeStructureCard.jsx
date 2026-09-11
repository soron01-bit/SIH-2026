import React from 'react';
import { Eye, Circle, Waves, Gauge, BarChart2 } from 'lucide-react';

/**
 * Derives eye & structure analysis data from a cyclone object.
 * Real data comes from backend; otherwise uses sensible derived estimates.
 */
const deriveEyeData = (cyclone) => {
  if (!cyclone) return null;

  const windKt = cyclone.windSpeedKnots || 45;
  const eyeDetected = cyclone.eyeDetected ?? (cyclone.eyeDiameterKm > 0 || windKt >= 60);
  const eyeDiameterKm = cyclone.eyeDiameterKm ?? (eyeDetected ? Math.round(20 + (windKt - 60) * 0.4) : null);
  const eyeRadiusKm = cyclone.eyeRadiusKm ?? (eyeDiameterKm ? Math.round(eyeDiameterKm / 2) : null);
  const eyewallCompleteness = cyclone.eyewallCompleteness ?? cyclone.eyewallSymmetry ?? (eyeDetected ? Math.min(99, 70 + (windKt - 60) * 0.8) : null);
  const rainBands = cyclone.rainBands || `${Math.round(3 + windKt / 25)} Spiral Bands`;
  const symmetry = cyclone.eyewallSymmetry ?? cyclone.symmetry ?? Math.min(99, Math.round(55 + windKt * 0.35));
  const dvorakCI = cyclone.dvorakCI ? cyclone.dvorakCI.replace('CI ', '') : (windKt / 25 + 1).toFixed(1);

  return { eyeDetected, eyeDiameterKm, eyeRadiusKm, eyewallCompleteness, rainBands, symmetry, dvorakCI };
};

const MetricRow = ({ icon: Icon, label, value, unit, barPercent, barColor = '#38bdf8', mono = true }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-slate-500" />}
        {label}
      </span>
      <span className={`font-semibold text-white ${mono ? 'font-mono' : ''}`}>
        {value}
        {unit && <span className="text-slate-400 font-normal ml-1 text-[11px]">{unit}</span>}
      </span>
    </div>
    {barPercent !== undefined && !isNaN(barPercent) && (
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(5, Math.min(100, barPercent))}%`, backgroundColor: barColor }}
        />
      </div>
    )}
  </div>
);

export const EyeStructureCard = ({ cyclone }) => {
  const data = deriveEyeData(cyclone);

  if (!cyclone || !data) {
    return (
      <div className="py-4 text-center text-xs text-slate-400 space-y-1">
        <Eye className="w-5 h-5 mx-auto text-slate-600" />
        <div>No active system — eye analysis standby</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Eye Detected Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Eye & Structure Analysis
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
          data.eyeDetected
            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}>
          Eye {data.eyeDetected ? 'DETECTED' : 'NOT DETECTED'}
        </div>
      </div>

      <div className="space-y-3 pt-1 border-t border-slate-800/80">
        {/* Eye Detected toggle-style row */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-slate-500" />
            Eye Detected
          </span>
          <span className={`font-bold ${data.eyeDetected ? 'text-emerald-400' : 'text-slate-500'}`}>
            {data.eyeDetected ? 'YES' : 'NO'}
          </span>
        </div>

        {data.eyeDetected && data.eyeDiameterKm && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Circle className="w-3 h-3 text-slate-500" />
              Eye Diameter
            </span>
            <div className="text-right">
              <span className="font-bold font-mono text-white">{data.eyeDiameterKm} km</span>
              <span className="text-slate-400 text-[11px] ml-1 font-mono">
                (Radius: {(data.eyeDiameterKm / 2).toFixed(1)} km)
              </span>
            </div>
          </div>
        )}

        {data.eyewallCompleteness !== null && (
          <MetricRow
            icon={Gauge}
            label="Eyewall"
            value={`${Math.round(data.eyewallCompleteness)}%`}
            barPercent={data.eyewallCompleteness}
            barColor={data.eyewallCompleteness >= 80 ? '#10b981' : data.eyewallCompleteness >= 60 ? '#f59e0b' : '#ef4444'}
          />
        )}

        <div className="flex items-start justify-between text-xs gap-2">
          <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
            <Waves className="w-3 h-3 text-slate-500" />
            Rain Bands
          </span>
          <span className="font-medium text-white text-right truncate" title={String(data.rainBands)}>
            {typeof data.rainBands === 'string' && data.rainBands.length > 25
              ? `${data.rainBands.slice(0, 25)}…`
              : data.rainBands}
          </span>
        </div>

        <MetricRow
          icon={BarChart2}
          label="Symmetry"
          value={`${Math.round(data.symmetry)}%`}
          barPercent={data.symmetry}
          barColor="#38bdf8"
        />

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <span className="text-slate-400">Dvorak C.I.</span>
          <span className="font-bold font-mono text-purple-400">CI {data.dvorakCI}</span>
        </div>
      </div>
    </div>
  );
};

export default EyeStructureCard;
