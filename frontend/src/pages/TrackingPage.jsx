import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Table,
  Filter,
  Eye,
  Sliders,
  Calendar,
  Wind,
  Gauge,
  Info,
  UploadCloud,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import CycloneMap from '../components/map/CycloneMap';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { IMD_CATEGORIES } from '../data/mockCyclones';
import { useAIModel } from '../context/AIModelContext';

export const TrackingPage = () => {
  const { detectedCyclone, clearCycloneAnalysis } = useAIModel();
  const [cyclones, setCyclones] = useState([]);
  const [selectedCycloneId, setSelectedCycloneId] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('ALL');
  const [showCone, setShowCone] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadTrackingData = async () => {
    setLoading(true);
    try {
      const { data } = await cycloneService.getAll();
      const list = data || [];
      setCyclones(list);
      if (list.length > 0) {
        setSelectedCycloneId((prev) => {
          const exists = list.some((c) => c.id === prev);
          return exists ? prev : list[0].id;
        });
      } else {
        setSelectedCycloneId('');
      }
    } catch (err) {
      console.error('Error fetching cyclones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();

    const handleUpdate = () => {
      loadTrackingData();
    };

    window.addEventListener('cyclonex:cyclone-updated', handleUpdate);
    return () => window.removeEventListener('cyclonex:cyclone-updated', handleUpdate);
  }, []);

  // Sync if detectedCyclone in context updates
  useEffect(() => {
    if (detectedCyclone) {
      setCyclones((prev) => {
        const filtered = prev.filter((c) => c.id !== detectedCyclone.id);
        return [detectedCyclone, ...filtered];
      });
      setSelectedCycloneId(detectedCyclone.id);
    }
  }, [detectedCyclone]);

  const currentCyclone = cyclones.find((c) => c.id === selectedCycloneId) || cyclones[0];

  const handleReset = () => {
    clearCycloneAnalysis();
    setCyclones([]);
    setSelectedCycloneId('');
  };

  const filteredCyclones = selectedBasin === 'ALL'
    ? cyclones
    : cyclones.filter((c) => c.basin === selectedBasin);

  // Combine track points for the chronological telemetry table
  const allWaypoints = currentCyclone
    ? [
        ...(currentCyclone.historicalTrack || []).map((pt) => ({
          ...pt,
          type: 'OBSERVED',
        })),
        {
          id: 'current-eye',
          timestamp: currentCyclone.detectedAt,
          latitude: currentCyclone.latitude,
          longitude: currentCyclone.longitude,
          windSpeedKnots: currentCyclone.windSpeedKnots,
          pressureHpa: currentCyclone.pressureHpa,
          classification: currentCyclone.classification,
          type: 'CURRENT EYE',
        },
        ...(currentCyclone.forecastTrack || []).map((fc) => ({
          ...fc,
          type: `FORECAST (${fc.forecastHour})`,
        })),
      ]
    : [];

  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Geospatial Tracking Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cyclone positioning, historical trajectory waypoints, and projected cone of uncertainty.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/analysis"
            className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload & Analyze Satellite Capture</span>
          </Link>

          {currentCyclone ? (
            <>
              <Badge severity={currentCyclone.riskLevel}>
                ● TRACKING: {currentCyclone.name.toUpperCase()}
              </Badge>
              <button
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs flex items-center gap-1.5 transition-colors"
                title="Clear detected cyclone and return to standby"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Map</span>
              </button>
            </>
          ) : (
            <Badge variant="safe">
              ● SURVEILLANCE ACTIVE (STANDBY)
            </Badge>
          )}
        </div>
      </div>

      {/* ENHANCED MAP TOOLBAR */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-lg overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 text-xs border-b border-slate-800/60">
          <div className="flex items-center gap-3 flex-wrap">
            {/* View mode tabs */}
            <div className="flex items-center rounded-md overflow-hidden border border-slate-800 bg-slate-900/60">
              {['Satellite', 'Dark', 'Light'].map((mode) => (
                <button
                  key={mode}
                  className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors first:text-white first:bg-slate-800"
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Cyclone target selector */}
            {cyclones.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target:</span>
                <select
                  value={selectedCycloneId}
                  onChange={(e) => setSelectedCycloneId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  {cyclones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.classificationCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">Basin:</span>
              <span className="font-semibold text-sky-400">
                {currentCyclone ? currentCyclone.basin : 'North Indian Ocean'}
              </span>
            </div>
          </div>

          {/* Right side: live coordinates + wind */}
          {currentCyclone && (
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Eye:</span>
                <strong className="text-sky-400">{currentCyclone.latitude.toFixed(1)}°N, {currentCyclone.longitude.toFixed(1)}°E</strong>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                <Wind className="w-3 h-3 text-amber-400" />
                <strong className="text-white">{currentCyclone.windSpeedKnots} kt</strong>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                <Gauge className="w-3 h-3 text-orange-400" />
                <strong className="text-white">{currentCyclone.pressureHpa} hPa</strong>
              </div>
            </div>
          )}
        </div>

        {/* Layer controls + legend strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 text-[11px]">
          <span className="text-slate-400 font-semibold uppercase tracking-wider">Map Layers:</span>
          {[
            { label: 'Cyclone Track', color: '#38bdf8', active: true },
            { label: 'Waypoints & Eye', color: '#f59e0b', active: true },
            { label: 'Uncertainty Cone', color: '#94a3b8', active: showCone },
          ].map(({ label, color, active }) => (
            <button
              key={label}
              onClick={() => label === 'Uncertainty Cone' && setShowCone(!showCone)}
              className={`flex items-center gap-1.5 transition-opacity ${active ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
              <span className="text-slate-300">{label}</span>
            </button>
          ))}
          <span className="text-slate-700 mx-1">|</span>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-semibold uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 inline-block" /><span className="text-slate-400">Past (observed)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" /><span className="text-slate-400">Forecast</span></div>
          </div>
        </div>
      </div>

      {/* EXPANSIVE HERO MAP */}
      <CycloneMap
        cyclone={currentCyclone}
        height="540px"
        showCone={showCone}
        interactive={true}
      />

      {/* COMPACT IMD INTENSITY SCALE */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">IMD Tropical Cyclone Intensity Classification Scale</span>
          <span className="text-[11px]">3-Minute Average Sustained Winds</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {Object.entries(IMD_CATEGORIES).map(([code, cat]) => (
            <div
              key={code}
              className="p-2 rounded border border-slate-800 bg-slate-900/60 space-y-0.5"
            >
              <div className="font-semibold" style={{ color: cat.color }}>
                {code} • {cat.name}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {cat.windMin} - {cat.windMax === 999 ? '120+' : cat.windMax} kt
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL WAYPOINTS TELEMETRY TABLE */}
      <Card
        icon={Table}
        title={currentCyclone ? `Observation & Forecast Waypoints // ${currentCyclone.name}` : 'Observation & Forecast Waypoints'}
        subtitle="Chronological sequence of verified radar observations and model track projections"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-medium">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Stage / Classification</th>
                <th className="py-2.5 px-3">Winds</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">Uncertainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {allWaypoints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-sans text-xs">
                    No active cyclone waypoints logged. Oceanic basins are under continuous normal surveillance.
                  </td>
                </tr>
              ) : (
                allWaypoints.map((pt, idx) => (
                  <tr
                    key={pt.id || idx}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      pt.type === 'CURRENT EYE' ? 'bg-sky-950/20 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          pt.type === 'CURRENT EYE'
                            ? 'bg-sky-950/60 text-sky-400 border border-sky-800/60 font-bold'
                            : pt.type.startsWith('FORECAST')
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pt.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans text-[11px]">
                      {new Date(pt.timestamp).toUTCString().replace('GMT', 'UTC')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">
                      {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                    </td>
                    <td className="py-2 px-3 text-sky-400 font-sans">{pt.classification}</td>
                    <td className="py-2 px-3">
                      <span className="text-white font-semibold">{pt.windSpeedKnots} kt</span>
                      <span className="text-slate-400 text-[11px] ml-1 font-sans">
                        ({Math.round(pt.windSpeedKnots * 1.852)} km/h)
                      </span>
                    </td>
                    <td className="py-2 px-3 text-amber-400">{pt.pressureHpa} hPa</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] font-sans">
                      {pt.uncertaintyRadiusKm ? `±${pt.uncertaintyRadiusKm} km` : '0 km (Observed)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TrackingPage;
