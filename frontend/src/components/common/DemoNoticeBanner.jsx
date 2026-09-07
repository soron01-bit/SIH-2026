import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export const DemoNoticeBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-blue-950/90 border-b border-cyan-500/30 px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
            <Info className="w-3.5 h-3.5" />
            SIH26070 PROTOTYPE
          </span>
          <span className="text-slate-200">
            <strong>System Operational Mode:</strong> Frontend Phase 1. Meteorological tracks, telemetry, and bulletins are loaded from <span className="text-cyan-300 font-mono">Curated Demo Data</span>.
          </span>
          <span className="text-slate-400 hidden md:inline">
            Deep Learning PyTorch models (ResNet/EfficientNet + CNN-LSTM) will be connected in Phase 4/5.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DemoNoticeBanner;
