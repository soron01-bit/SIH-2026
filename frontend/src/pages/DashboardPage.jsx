import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Wind,
  Gauge,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Radio,
  Layers,
  Clock,
  Compass,
  ArrowRight,
  Navigation,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import alertService from '../services/alertService';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import CycloneMap from '../components/map/CycloneMap';
import IntensityChart from '../components/dashboard/IntensityChart';
import SatellitePreviewCard from '../components/dashboard/SatellitePreviewCard';
import QuickAlertsList from '../components/dashboard/QuickAlertsList';
import SystemHealthCard from '../components/dashboard/SystemHealthCard';
import { useAIModel } from '../context/AIModelContext';

export const DashboardPage = () => {
  const { detectedCyclone } = useAIModel();
  const [cyclones, setCyclones] = useState([]);
  const [selectedCyclone, setSelectedCyclone] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const cyclonesRes = await cycloneService.getAll();
      const cycloneList = cyclonesRes.data || [];
      setCyclones(cycloneList);
      setSelectedCyclone(cycloneList.length > 0 ? cycloneList[0] : null);

      const alertsRes = await alertService.getAll();
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      const now = new Date();
      setLastCheckTime(now.toUTCString().replace('GMT', 'UTC'));
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('cyclonex:cyclone-updated', handleUpdate);
    return () => window.removeEventListener('cyclonex:cyclone-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (detectedCyclone) {
      setSelectedCyclone(detectedCyclone);
    }
  }, [detectedCyclone]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2.5">
        <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading latest cyclone monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER: CYCLONE MONITORING & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Cyclone Monitoring
            </h1>
            {selectedCyclone ? (
              <Badge severity={selectedCyclone.riskLevel}>
                ● ACTIVE: {selectedCyclone.name.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="safe">
                ● NO ACTIVE CYCLONE
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            North Indian Ocean Surveillance • Bay of Bengal & Arabian Sea
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Ingest: <strong className="text-slate-300 font-mono font-normal">{lastCheckTime ? lastCheckTime.substring(17, 25) + ' UTC' : 'Live'}</strong></span>
        </div>
      </div>

      {/* 2. PRIMARY CYCLONE STATUS BLOCK */}
      {selectedCyclone ? (
        /* ACTIVE CYCLONE CORE METRICS */
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Cyclone
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <h2 className="text-xl font-bold text-white">{selectedCyclone.name}</h2>
                <span className="text-xs text-sky-400 font-medium">{selectedCyclone.classification} ({selectedCyclone.classificationCode})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/cyclones/${selectedCyclone.id}`}
                className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-200 font-medium transition-colors"
              >
                Storm Dossier
              </Link>
              <Link
                to="/tracking"
                className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Live Tracking Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Wind Speed</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {selectedCyclone.windSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">({selectedCyclone.windSpeedKnots} knots)</span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Central Pressure</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {selectedCyclone.pressureHpa} <span className="text-xs font-normal text-slate-400">hPa</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Lower indicates stronger system</span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Movement</span>
              <div className="text-base font-bold text-white mt-0.5">
                {selectedCyclone.movementDirection}
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">at {selectedCyclone.movementSpeedKmh || 14} km/h</span>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Current Location</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {selectedCyclone.latitude}°N, {selectedCyclone.longitude}°E
              </div>
              <span className="text-[11px] text-slate-400 block">{selectedCyclone.basin}</span>
            </div>
          </div>
        </div>
      ) : (
        /* NO ACTIVE CYCLONE OPERATIONAL CARD */
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h2 className="text-base font-semibold text-emerald-400">
                  NO ACTIVE CYCLONE
                </h2>
              </div>
              <p className="text-sm text-slate-300 font-normal leading-relaxed">
                Monitoring systems are operational and continuously scanning the North Indian Ocean. No cyclonic circulation detected.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span>Last update: <strong className="text-slate-300 font-normal">{lastCheckTime ? lastCheckTime.substring(17, 25) + ' UTC' : '18:45 UTC'}</strong></span>
                <span>•</span>
                <span>AI Model: <strong className="text-emerald-400 font-normal">Ready</strong></span>
                <span>•</span>
                <span>Surveillance: <strong className="text-slate-300 font-normal">Continuous</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/analysis"
                className="px-3.5 py-2 rounded bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-200 font-medium transition-colors"
              >
                Analyze Satellite Image
              </Link>
              <Link
                to="/tracking"
                className="px-3.5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-xs text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Live Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. PREDICTED TRAJECTORY TIMELINE (SHOWN WHEN SYSTEM HAS TRACK DATA) */}
      {selectedCyclone?.forecastTrack && selectedCyclone.forecastTrack.length > 0 && (
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Predicted Trajectory Timeline
            </span>
            <span className="text-slate-500 font-mono text-[11px]">Movement & Intensity Forecast</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-sky-900/60">
              <span className="text-[10px] text-sky-400 font-semibold block uppercase">CURRENT</span>
              <div className="font-bold text-white font-mono mt-0.5">{selectedCyclone.windSpeedKmh} km/h</div>
              <span className="text-[11px] text-slate-400 block">{selectedCyclone.classificationCode}</span>
            </div>
            {selectedCyclone.forecastTrack.slice(0, 4).map((fc) => (
              <div key={fc.id} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-400 font-semibold block">{fc.forecastHour}</span>
                <div className="font-bold text-white font-mono mt-0.5">{Math.round(fc.windSpeedKnots * 1.852)} km/h</div>
                <span className="text-[11px] text-slate-400 block">{fc.classification.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE: LIVE MAP + INTENSITY GRAPH & SENSORS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Live Location Map & Intensity Graph (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <Card
            icon={Compass}
            title="Live Location Map"
            subtitle="Observed track, projected path, and uncertainty cone"
            action={
              <Link
                to="/tracking"
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <span>Full Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <CycloneMap cyclone={selectedCyclone} height="430px" showCone={true} />
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                {selectedCyclone
                  ? `Active System: ${selectedCyclone.name} (${selectedCyclone.classificationCode})`
                  : 'Sector Status: Zero cyclonic circulations detected.'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Basin: North Indian Ocean</span>
            </div>
          </Card>

          {/* Intensity Evolution Graph */}
          <Card
            icon={Activity}
            title="Intensity Evolution"
            subtitle="Sustained surface winds vs central pressure profile over time"
          >
            {selectedCyclone ? (
              <IntensityChart cyclone={selectedCyclone} height={230} />
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <Activity className="w-5 h-5 mx-auto text-slate-500" />
                <div className="text-slate-300 font-medium">Trajectory & Intensity Graph Standby</div>
                <div className="text-[11px] text-slate-500">
                  Data curves generate automatically when a storm system is active.
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Satellite Feed, Coastal Advisories, Pipeline (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card
            icon={Layers}
            title="Satellite Feed Preview"
            subtitle="INSAT-3DR Multispectral Stream"
          >
            <SatellitePreviewCard cyclone={selectedCyclone} />
          </Card>

          <Card
            icon={ShieldAlert}
            title="Coastal Sector Advisories"
            subtitle="Disaster Management Bulletins"
          >
            {alerts.length > 0 ? (
              <QuickAlertsList alerts={alerts} />
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-slate-300 font-medium">All Coastal Sectors Clear</div>
                <div className="text-[11px] text-slate-500">No active warnings or advisories in effect.</div>
              </div>
            )}
          </Card>

          <Card
            icon={Radio}
            title="System Telemetry"
            subtitle="Sensor Ingest & Pipeline Health"
          >
            <SystemHealthCard />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
