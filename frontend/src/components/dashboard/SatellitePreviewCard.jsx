import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Maximize2, Radio, Crosshair } from 'lucide-react';

export const SatellitePreviewCard = ({ cyclone = null }) => {
  const [activeBand, setActiveBand] = useState('TIR1');

  const bands = [
    { id: 'TIR1', label: 'TIR-1 (10.8 µm)', desc: 'Thermal IR Cloud Tops' },
    { id: 'WV', label: 'WV (6.7 µm)', desc: 'Upper Troposphere Vapor' },
    { id: 'VIS', label: 'VIS (0.65 µm)', desc: 'Visible Reflectance' },
  ];

  return (
    <div className="space-y-3">
      {/* Band selector buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-meteor-border">
          {bands.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBand(b.id)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-all ${
                activeBand === b.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b.id}
            </button>
          ))}
        </div>

        <Link
          to="/analysis"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
        >
          <span>Studio</span>
          <Maximize2 className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Satellite Imagery Frame */}
      <div className="relative aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden border border-meteor-border bg-slate-950 flex items-center justify-center p-4">
        {cyclone ? (
          <>
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeBand === 'TIR1'
                  ? 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(244,63,94,0.45)_0%,_rgba(234,179,8,0.3)_25%,_rgba(6,182,212,0.25)_50%,_rgba(15,23,42,0.95)_75%)]'
                  : activeBand === 'WV'
                  ? 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(168,85,247,0.45)_0%,_rgba(59,130,246,0.3)_35%,_rgba(15,23,42,0.95)_75%)]'
                  : 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(255,255,255,0.4)_0%,_rgba(148,163,184,0.25)_30%,_rgba(15,23,42,0.95)_75%)]'
              }`}
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded border border-slate-700/60 font-mono text-[10px] text-slate-300">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                {cyclone.satelliteSensor || 'INSAT-3DR'}
              </div>
              <div className="text-slate-400">CH: {activeBand} | RES: 4km</div>
            </div>
            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded border border-slate-700/60 font-mono text-[10px] text-slate-300">
              <div className="text-slate-400">Eye Reticle Coordinates</div>
              <div className="text-white font-bold">
                {cyclone.latitude?.toFixed(2)}°N / {cyclone.longitude?.toFixed(2)}°E
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-2 text-xs font-mono text-slate-400">
            <Layers className="w-8 h-8 mx-auto text-cyan-400/80" />
            <div className="text-slate-200 font-semibold">Sensor Stream Standby</div>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              No active storm pattern identified. Upload satellite imagery in the AI Analysis studio.
            </p>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
        {bands.find((b) => b.id === activeBand)?.desc} • INSAT-3D/3DR Satellite Protocol
      </div>
    </div>
  );
};

export default SatellitePreviewCard;
