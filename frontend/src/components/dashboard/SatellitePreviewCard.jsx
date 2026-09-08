import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronRight, Radio } from 'lucide-react';

export const SatellitePreviewCard = ({ cyclone = null }) => {
  const [activeBand, setActiveBand] = useState('TIR1');

  const bands = [
    { id: 'TIR1', label: 'Thermal IR (10.8µm)', desc: 'Cloud top brightness temperature' },
    { id: 'WV', label: 'Water Vapor (6.7µm)', desc: 'Mid-troposphere moisture flow' },
    { id: 'VIS', label: 'Visible (0.65µm)', desc: 'Daylight structural reflectance' },
  ];

  return (
    <div className="space-y-3">
      {/* Band selector buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          {bands.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBand(b.id)}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                activeBand === b.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b.id}
            </button>
          ))}
        </div>

        <Link
          to="/analysis"
          className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
        >
          <span>Studio</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Satellite Imagery Frame */}
      <div className="relative aspect-video sm:aspect-[4/3] rounded-md overflow-hidden border border-slate-800 bg-[#080c15] flex items-center justify-center p-4">
        {cyclone ? (
          <>
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                activeBand === 'TIR1'
                  ? 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(239,68,68,0.3)_0%,_rgba(234,179,8,0.2)_25%,_rgba(14,165,233,0.15)_50%,_rgba(15,23,42,0.95)_75%)]'
                  : activeBand === 'WV'
                  ? 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(147,51,234,0.3)_0%,_rgba(59,130,246,0.2)_35%,_rgba(15,23,42,0.95)_75%)]'
                  : 'bg-[radial-gradient(ellipse_at_55%_45%,_rgba(241,245,249,0.25)_0%,_rgba(148,163,184,0.15)_30%,_rgba(15,23,42,0.95)_75%)]'
              }`}
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 font-mono text-[10px] text-slate-300">
              <div className="text-white font-semibold flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-sky-400" />
                {cyclone.satelliteSensor || 'INSAT-3DR'}
              </div>
              <div className="text-slate-400">{activeBand} • 4km Nadir Resolution</div>
            </div>
            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 font-mono text-[10px] text-slate-300">
              <span className="text-slate-400">Eye Center: </span>
              <span className="text-white font-medium">
                {cyclone.latitude?.toFixed(1)}°N / {cyclone.longitude?.toFixed(1)}°E
              </span>
            </div>
          </>
        ) : (
          <div className="text-center space-y-2 text-xs text-slate-400">
            <Layers className="w-6 h-6 mx-auto text-slate-500" />
            <div className="text-slate-300 font-medium">Continuous Satellite Ingest Active</div>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              No active storm pattern identified in monitored sectors. You can upload custom satellite imagery to test inference.
            </p>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 leading-snug">
        {bands.find((b) => b.id === activeBand)?.desc} • ISRO MOSDAC / NOAA Sensor Ingest
      </div>
    </div>
  );
};

export default SatellitePreviewCard;
