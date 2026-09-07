import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Layers,
  Table,
  Filter,
  Eye,
  Sliders,
  Calendar,
  Wind,
  Gauge,
  Info,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import CycloneMap from '../components/map/CycloneMap';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { IMD_CATEGORIES } from '../data/mockCyclones';

export const TrackingPage = () => {
  const [cyclones, setCyclones] = useState([]);
  const [selectedCycloneId, setSelectedCycloneId] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('ALL');
  const [showCone, setShowCone] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await cycloneService.getAll();
        setCyclones(data || []);
        if (data && data.length > 0) {
          setSelectedCycloneId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching cyclones:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentCyclone = cyclones.find((c) => c.id === selectedCycloneId) || cyclones[0];

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
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-meteor-border/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display tracking-wide text-white">
              Geospatial Cyclone Tracking Engine
            </h1>
            <Badge variant="cyan" size="sm">
              LEAFLET GEOSPATIAL
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Interactive Multi-Point Trajectory • Dynamic Cone of Uncertainty • Telemetry Waypoints
          </p>
        </div>
      </div>

      {/* TRACKING TOOLBAR */}
      <div className="bg-meteor-900/90 border border-meteor-border p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400">Tracked Target:</span>
          <span className="font-semibold text-white">ACTIVE CYCLONIC CIRCULATION</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400">North Indian Ocean</span>
        </div>

        {/* Layer display toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={showCone}
              onChange={(e) => setShowCone(e.target.checked)}
              className="rounded bg-slate-950 border-meteor-border text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Show Cone of Uncertainty</span>
          </label>
        </div>
      </div>

      {/* EXPANSIVE INTERACTIVE MAP */}
      <CycloneMap
        cyclone={currentCyclone}
        height="550px"
        showCone={showCone}
        interactive={true}
      />

      {/* CATEGORY PALETTE & INTENSITY SCALE BAR */}
      <div className="bg-slate-950/80 border border-meteor-border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold text-slate-200">IMD Tropical Cyclone Intensity Classification Scale</span>
          <span>Wind Thresholds (3-Minute Average)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px] font-mono">
          {Object.entries(IMD_CATEGORIES).map(([code, cat]) => (
            <div
              key={code}
              className="p-2 rounded-lg border border-slate-800/80 space-y-1"
              style={{ backgroundColor: `${cat.color}10`, borderColor: `${cat.color}40` }}
            >
              <div className="font-bold" style={{ color: cat.color }}>
                {code} • {cat.name}
              </div>
              <div className="text-slate-300">
                {cat.windMin} - {cat.windMax === 999 ? '120+' : cat.windMax} kt
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL WAYPOINTS TABLE */}
      <Card
        icon={Table}
        title={currentCyclone ? `Telemetry Track Records // ${currentCyclone.name}` : 'Telemetry Track Records // Standby'}
        subtitle="Chronological sequence of observation waypoints and model forecast track points"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-meteor-border text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Category / Stage</th>
                <th className="py-2.5 px-3">Winds (kt / km/h)</th>
                <th className="py-2.5 px-3">Pressure (hPa)</th>
                <th className="py-2.5 px-3">Uncertainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-meteor-border/50 text-slate-300">
              {allWaypoints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-mono">
                    No active cyclone waypoints recorded. System monitoring North Indian Ocean in standby.
                  </td>
                </tr>
              ) : (
                allWaypoints.map((pt, idx) => (
                  <tr
                    key={pt.id || idx}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      pt.type === 'CURRENT EYE' ? 'bg-cyan-500/10 font-semibold' : ''
                    }`}
                  >
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        pt.type === 'CURRENT EYE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : pt.type.startsWith('FORECAST')
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pt.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {new Date(pt.timestamp).toUTCString().replace('GMT', 'UTC')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {pt.latitude.toFixed(2)}°N, {pt.longitude.toFixed(2)}°E
                  </td>
                  <td className="py-2.5 px-3 text-cyan-400">{pt.classification}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-white font-bold">{pt.windSpeedKnots} kt</span>
                    <span className="text-slate-500 text-[10px] ml-1">
                      ({Math.round(pt.windSpeedKnots * 1.852)} km/h)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">{pt.pressureHpa} hPa</td>
                  <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                    {pt.uncertaintyRadiusKm ? `±${pt.uncertaintyRadiusKm} km` : 'Observation (0 km)'}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TrackingPage;
