import React, { useState } from 'react';
import {
  FileText,
  Wind,
  Gauge,
  MapPin,
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  ChevronRight,
  Shield,
  Radio,
  Eye,
  Activity,
  Layers,
  Sparkles,
  Waves,
  TrendingDown,
  Navigation,
} from 'lucide-react';
import Badge from '../common/Badge';

export const CycloneDossierReport = ({ cyclone }) => {
  const [activeTab, setActiveTab] = useState('landfall');

  if (!cyclone) return null;

  const colorMap = {
    SuCS: '#a855f7',
    ESCS: '#ef4444',
    VSCS: '#f97316',
    SCS: '#f59e0b',
    CS: '#10b981',
    DD: '#0ea5e9',
    D: '#38bdf8',
  };
  const color = colorMap[cyclone.classificationCode] || '#38bdf8';

  const handleExportCSV = () => {
    const headers = 'Timestamp_UTC,Latitude_N,Longitude_E,Wind_Knots,Wind_kmh,Pressure_hPa,Classification\n';
    const rows = (cyclone.historicalTrack || [])
      .map(
        (p) =>
          `${p.timestamp},${p.latitude},${p.longitude},${p.windSpeedKnots},${Math.round(
            p.windSpeedKnots * 1.852
          )},${p.pressureHpa},"${p.classification}"`
      )
      .join('\n');

    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${cyclone.name.replace(/\s+/g, '_')}_IMD_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all duration-300">
      {/* ── HEADER STRIP ─────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#0e1628] to-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              {cyclone.name} — Official Meteorological Dossier
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded border"
              style={{
                color,
                borderColor: `${color}60`,
                backgroundColor: `${color}15`,
              }}
            >
              {cyclone.classificationCode} • {cyclone.classification}
            </span>
          </div>

          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              {cyclone.basin || 'Bay of Bengal'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {cyclone.dates || cyclone.season || 'Historical Archive'}
            </span>
            <span>•</span>
            <span className="text-slate-300 font-mono">
              IMD RSMC Best Track • CI {cyclone.dvorakCI?.replace('CI ', '') || '4.0'}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-700/60 text-sky-300 text-xs font-semibold transition-colors shadow-sm"
            title="Download full coordinates CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Print or Save PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── TOP METRIC HIGHLIGHTS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-800/80 border-b border-slate-800/80 bg-[#080d19]">
        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Wind className="w-3 h-3 text-sky-400" />
            Peak Winds
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {cyclone.windSpeedKnots} <span className="text-xs font-normal text-slate-400">kt</span>
          </div>
          <div className="text-[11px] text-sky-400/90 font-mono">
            {cyclone.windSpeedKmh || Math.round(cyclone.windSpeedKnots * 1.852)} km/h
            {cyclone.gustsKmh ? ` (gusts ${cyclone.gustsKmh})` : ''}
          </div>
        </div>

        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3 h-3 text-indigo-400" />
            Central Pressure
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {cyclone.pressureHpa} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-[11px] text-indigo-400/80 font-mono flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Min Observed
          </div>
        </div>

        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-400" />
            Dvorak Analysis
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {cyclone.dvorakCI || 'CI 4.0'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {cyclone.dvorakT || 'T4.0'} • {cyclone.eyeDiameterKm || 24} km Eye
          </div>
        </div>

        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Waves className="w-3 h-3 text-cyan-400" />
            Storm Surge
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {cyclone.landfall?.stormSurge?.split(' ')[0] || '1.5'} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Above Astronomical Tide
          </div>
        </div>

        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" />
            RI Probability
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {cyclone.riProbability ?? 42}%
          </div>
          <div className="text-[11px] text-amber-300/70 font-mono">
            {cyclone.riProbability >= 40 ? 'High RI Tendency' : 'Moderate Influx'}
          </div>
        </div>

        <div className="p-3.5 space-y-0.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Navigation className="w-3 h-3 text-rose-400" />
            Landfall Status
          </div>
          <div className="text-sm font-bold text-rose-300 truncate">
            {cyclone.landfall ? 'Crossed Coast' : 'Active Track'}
          </div>
          <div className="text-[11px] text-slate-400 truncate font-mono">
            {cyclone.landfall?.date ? cyclone.landfall.date.split(' ')[0] : 'IMD Bulletins'}
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
        {[
          { id: 'landfall', label: 'Landfall & Impact Assessment', icon: MapPin },
          { id: 'eye-cloud', label: 'Eye Wall & Cloud Physics', icon: Eye },
          { id: 'ri-xai', label: 'Rapid Intensification & XAI', icon: Sparkles },
          { id: 'track-log', label: 'Synoptic Track Coordinates Log', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isSelected
                  ? 'border-sky-500 text-sky-400 bg-sky-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENTS ─────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 text-xs leading-relaxed text-slate-300">
        {/* TAB 1: LANDFALL & IMPACT */}
        {activeTab === 'landfall' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                Landfall Summary & Inundation Record
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 font-medium">Exact Landfall Site: </span>
                    <span className="text-white font-semibold">
                      {cyclone.landfall?.location || 'Crossing coastal belt'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Date & Time Window: </span>
                    <span className="text-amber-300 font-mono">
                      {cyclone.landfall?.date} ({cyclone.landfall?.timeWindow || 'Night to Early Morning'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Landfall Surface Winds: </span>
                    <span className="text-sky-300 font-mono font-bold">
                      {cyclone.landfall?.landfallWinds || `${cyclone.windSpeedKmh} km/h`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Storm Surge Amplitude: </span>
                    <span className="text-cyan-300 font-semibold">
                      {cyclone.landfall?.stormSurge || '1.0 - 2.0 meters'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 font-medium">Peak 24h Rainfall: </span>
                    <span className="text-emerald-300 font-mono">
                      {cyclone.landfall?.rainfallRecord || 'Heavy to extremely heavy (>200 mm)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Affected Districts & States: </span>
                    <span className="text-slate-200">
                      {cyclone.landfall?.affectedAreas || 'Coastal Odisha, West Bengal, Andhra Pradesh, Bangladesh'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Evacuation & Shelters: </span>
                    <span className="text-slate-300">
                      {cyclone.landfall?.evacuations || 'Multi-purpose cyclone shelters activated.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Synopsis paragraph */}
            <div className="p-3.5 bg-sky-950/20 border border-sky-800/40 rounded-lg">
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                Meteorological Synopsis
              </div>
              <p className="text-xs text-sky-100/90 leading-relaxed">
                {cyclone.summary}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: EYE WALL & CLOUD PHYSICS */}
        {activeTab === 'eye-cloud' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-slate-400 text-[11px] font-medium">Eyewall Symmetry</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {cyclone.eyewallSymmetry ?? 88}%
                </div>
                <p className="text-[10px] text-slate-400">
                  Tight annular circulation with minimal azimuthal shear distortion.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-slate-400 text-[11px] font-medium">Eye Core Diameter</div>
                <div className="text-2xl font-bold font-mono text-sky-400">
                  {cyclone.eyeDiameterKm ?? 24} km
                </div>
                <p className="text-[10px] text-slate-400">
                  Radius of Maximum Winds (RMW) confirmed via INSAT-3DR thermal IR band.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-1">
                <div className="text-slate-400 text-[11px] font-medium">Convective Cloud Tops</div>
                <div className="text-2xl font-bold font-mono text-violet-400">
                  {cyclone.convectiveTopTemp ?? '-82°C'}
                </div>
                <p className="text-[10px] text-slate-400">
                  Ultra-cold central dense overcast (CDO) driving vigorous deep tropospheric uplift.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Rainband & Doppler Radar Signatures
              </div>
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">Rain Band Structure: </span>
                {cyclone.rainBands || 'Dual spiral feeder bands wrapping counter-clockwise into central eyewall.'}
              </p>
              <p className="text-xs text-slate-300">
                <span className="font-semibold text-white">Primary Remote Sensors: </span>
                {cyclone.satelliteSensor || 'INSAT-3DR Multispectral + Indian Coastal Doppler Radar Network'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: RAPID INTENSIFICATION & XAI */}
        {activeTab === 'ri-xai' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  SHAP Explainability Attribution (Environmental Intensification Drivers)
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  RI Probability: {cyclone.riProbability}%
                </span>
              </div>

              <div className="space-y-2.5">
                {(cyclone.xaiFeatures || [
                  { name: 'Sea Surface Temperature (SST > 30°C)', score: 0.88, impact: 'High Thermal Reservoir' },
                  { name: 'Low Vertical Wind Shear (<12 kt)', score: 0.74, impact: 'Preserves Vertical Core' },
                  { name: 'High Ocean Heat Content (>80 kJ/cm²)', score: 0.69, impact: 'Continuous Severe Fueling' },
                  { name: 'Upper Tropospheric Outflow Channels', score: 0.58, impact: 'Dual Poleward Outflow' },
                  { name: 'Mid-Level Relative Humidity (>80%)', score: 0.52, impact: 'Prevents Dry Air Influx' },
                ]).map((f, i) => {
                  const pct = f.value !== undefined
                    ? Math.round(f.value)
                    : (f.score !== undefined
                        ? (f.score <= 1 ? Math.round(f.score * 100) : Math.round(f.score))
                        : 50);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{f.name}</span>
                        <span className="font-mono text-sky-400 font-bold">
                          {pct}% {f.impact ? `(${f.impact})` : ''}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYNOPTIC TRACK COORDINATES LOG */}
        {activeTab === 'track-log' && (
          <div className="space-y-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/90">
                  <th className="py-2.5 px-3">Date / Time (UTC)</th>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Wind Speed</th>
                  <th className="py-2.5 px-3">Central Pressure</th>
                  <th className="py-2.5 px-3">Classification Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {(cyclone.historicalTrack || []).map((pt, idx) => {
                  const ptColor = colorMap[pt.categoryCode] || '#38bdf8';
                  return (
                    <tr key={pt.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-300">
                        {new Date(pt.timestamp).toUTCString().slice(5, 22)}
                      </td>
                      <td className="py-2.5 px-3 text-white font-semibold">
                        {pt.latitude?.toFixed(1)}°N, {pt.longitude?.toFixed(1)}°E
                      </td>
                      <td className="py-2.5 px-3 text-sky-300">
                        {pt.windSpeedKnots} kt{' '}
                        <span className="text-[10px] text-slate-400">
                          ({Math.round(pt.windSpeedKnots * 1.852)} km/h)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-indigo-300">{pt.pressureHpa} hPa</td>
                      <td className="py-2.5 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold border"
                          style={{
                            color: ptColor,
                            borderColor: `${ptColor}50`,
                            backgroundColor: `${ptColor}15`,
                          }}
                        >
                          {pt.classification}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CycloneDossierReport;
