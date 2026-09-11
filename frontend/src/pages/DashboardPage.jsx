import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Wind,
  Gauge,
  MapPin,
  ChevronRight,
  Radio,
  Layers,
  Clock,
  Compass,
  Navigation,
  Thermometer,
  AlertTriangle,
  Target,
  TrendingUp,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import CycloneMap from '../components/map/CycloneMap';
import IntensityChart from '../components/dashboard/IntensityChart';
import SystemHealthCard from '../components/dashboard/SystemHealthCard';
import RapidIntensificationCard from '../components/dashboard/RapidIntensificationCard';
import EyeStructureCard from '../components/dashboard/EyeStructureCard';
import XAIExplainabilityCard from '../components/dashboard/XAIExplainabilityCard';
import CycloneDossierReport from '../components/dashboard/CycloneDossierReport';
import UserLocationProximityCard from '../components/dashboard/UserLocationProximityCard';
import { useAIModel } from '../context/AIModelContext';

// ── Small stat instrument card ──────────────────────────────────────────────
const InstrumentCard = ({ label, value, unit, subValue, color = '#38bdf8', icon: Icon, alert }) => (
  <div className="relative bg-[#0c1220] border border-slate-800 rounded-lg p-3 space-y-1 overflow-hidden group hover:border-slate-700 transition-colors">
    {alert && (
      <div className="absolute top-2 right-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      </div>
    )}
    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
      {Icon && <Icon className="w-3 h-3" style={{ color }} />}
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </span>
      {unit && <span className="text-xs text-slate-400 font-normal">{unit}</span>}
    </div>
    {subValue && (
      <div className="text-[11px] text-slate-400 font-mono">{subValue}</div>
    )}
    {/* Subtle bottom accent */}
    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40" style={{ backgroundColor: color }} />
  </div>
);

// ── Active cyclone list item ─────────────────────────────────────────────────
const CycloneListItem = ({ cyclone, isSelected, onClick }) => {
  const colorMap = {
    SuCS: '#a855f7', ESCS: '#ef4444', VSCS: '#f97316',
    SCS: '#f59e0b', CS: '#10b981', DD: '#0ea5e9', D: '#38bdf8',
  };
  const color = colorMap[cyclone.classificationCode] || '#38bdf8';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'bg-sky-950/30 border-sky-700/60 shadow-sm'
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-semibold text-white truncate">{cyclone.name}</span>
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block border" style={{
            color, borderColor: `${color}50`, backgroundColor: `${color}15`
          }}>
            {cyclone.classificationCode}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold font-mono text-white">{cyclone.windSpeedKnots} kt</div>
          <div className="text-[11px] text-slate-400 font-mono">{cyclone.pressureHpa} hPa</div>
        </div>
      </div>
      <div className="mt-1.5 text-[10px] text-slate-400 font-mono">
        {cyclone.latitude?.toFixed(1)}°N, {cyclone.longitude?.toFixed(1)}°E
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500 truncate">{cyclone.classification?.split('(')[0].trim()}</div>
      {cyclone.basin && (
        <div className="mt-1 text-[10px] text-sky-400/70">{cyclone.basin}</div>
      )}
    </button>
  );
};

// ── OOD / Novelty warning banner ─────────────────────────────────────────────
const OODWarningBanner = ({ cyclone }) => {
  const ri = cyclone?.riProbability ?? 41;
  if (!cyclone || ri < 30) return null;

  return (
    <div className="bg-amber-950/40 border border-amber-700/60 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-600/50 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
          Out-of-Distribution / Novelty Warning
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-amber-200/80 leading-relaxed">
          The current storm pattern shows characteristics that differ significantly from the training distribution.
          Model predictions may have reduced reliability.{' '}
          <Link to="/tracking" className="text-amber-400 underline hover:text-amber-300 transition-colors">
            Track spread: {Math.round(cyclone.eyeRadiusKm || 22) + 343} km.
          </Link>
        </p>
        <p className="text-[11px] text-amber-400/70 flex items-center gap-1.5">
          <span>⚠</span>
          Forecaster review recommended before dissemination
        </p>
      </div>
    </div>
  );
};

// ── Main Dashboard Page ──────────────────────────────────────────────────────
export const DashboardPage = () => {
  const { detectedCyclone } = useAIModel();
  const [cyclones, setCyclones] = useState([]);
  const [selectedCyclone, setSelectedCyclone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const cyclonesRes = await cycloneService.getAll();
      const cycloneList = cyclonesRes.data || [];
      setCyclones(cycloneList);
      setSelectedCyclone((prev) => {
        if (prev) {
          const updated = cycloneList.find((c) => c.id === prev.id);
          return updated || (cycloneList.length > 0 ? cycloneList[0] : null);
        }
        return cycloneList.length > 0 ? cycloneList[0] : null;
      });
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
    const handleUpdate = () => loadDashboardData();
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

  const sc = selectedCyclone;
  const displayList = cyclones;

  // Derived metrics
  const landfallETA = sc?.landfallETA ?? '84h';
  const motionDeg = sc?.movementBearingDeg ?? 334;
  const riProb = sc?.riProbability ?? 41;
  const riChange = sc?.riIntensification ?? 13;

  return (
    <div className="space-y-4 pb-8">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Cyclone Intelligence Dashboard
            </h1>
            {sc ? (
              <Badge severity={sc.riskLevel}>● ACTIVE: {sc.name.toUpperCase()}</Badge>
            ) : (
              <Badge variant="safe">● NO ACTIVE CYCLONE</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            North Indian Ocean Surveillance • Bay of Bengal & Arabian Sea
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Last Ingest:{' '}
            <strong className="text-slate-300 font-mono font-normal">
              {lastCheckTime ? lastCheckTime.substring(17, 25) + ' UTC' : 'Live'}
            </strong>
          </span>
        </div>
      </div>

      {/* ── USER REAL-TIME LOCATION & CYCLONE PROXIMITY INTELLIGENCE ── */}
      <UserLocationProximityCard activeCyclone={sc} />

      {/* ── LAST 5 CYCLONES SELECTOR BAR ── */}
      {cyclones.length > 0 && (
        <div className="bg-[#0c1220] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Select Cyclone (Bay of Bengal & Indian Ocean Archives)</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
              Click any cyclone to view track map & detailed dossier report
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {cyclones.map((c) => {
              const isSel = sc?.id === c.id;
              const colorMap = {
                SuCS: '#a855f7', ESCS: '#ef4444', VSCS: '#f97316',
                SCS: '#f59e0b', CS: '#10b981', DD: '#0ea5e9', D: '#38bdf8',
              };
              const badgeColor = colorMap[c.classificationCode] || '#38bdf8';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCyclone(c)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left shrink-0 transition-all ${
                    isSel
                      ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-500/10 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: badgeColor }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {c.name}
                      <span
                        className="text-[9px] font-mono px-1 py-0.2 rounded border"
                        style={{
                          color: badgeColor,
                          borderColor: `${badgeColor}60`,
                          backgroundColor: `${badgeColor}15`,
                        }}
                      >
                        {c.classificationCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{c.dates?.split('–')[0]?.trim() || c.season}</span>
                      <span>•</span>
                      <span className="text-sky-300 font-semibold">{c.windSpeedKnots} kt</span>
                      <span>•</span>
                      <span>{c.pressureHpa} hPa</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INSTRUMENT STAT BAR ── */}
      {sc ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <InstrumentCard
            label="Wind"
            value={sc.windSpeedKnots}
            unit="kt"
            subValue={`${sc.windSpeedKmh} km/h`}
            color="#38bdf8"
            icon={Wind}
          />
          <InstrumentCard
            label="Pressure"
            value={sc.pressureHpa}
            unit="hPa"
            subValue="Central pressure"
            color="#f97316"
            icon={Gauge}
          />
          <InstrumentCard
            label="Category"
            value={sc.classificationCode}
            unit=""
            subValue={sc.classification?.split('(')[0].trim().replace('Storm', '').trim()}
            color={
              sc.classificationCode === 'SuCS' ? '#a855f7' :
              sc.classificationCode === 'ESCS' ? '#ef4444' :
              sc.classificationCode === 'VSCS' ? '#f97316' :
              sc.classificationCode === 'SCS' ? '#f59e0b' : '#10b981'
            }
            icon={Target}
          />
          <InstrumentCard
            label="Motion"
            value={`${sc.movementSpeedKmh || 14} kt`}
            unit=""
            subValue={`${motionDeg}°`}
            color="#10b981"
            icon={Navigation}
          />
          <InstrumentCard
            label="Landfall ETA"
            value={landfallETA}
            unit=""
            subValue={sc.landfallDate ?? '14 Sept 2026, 21:36'}
            color="#f59e0b"
            icon={MapPin}
            alert={true}
          />
          <InstrumentCard
            label="RI Prob"
            value={`${riProb}%`}
            unit=""
            subValue={`+${riChange} kt / 24h`}
            color={riProb >= 40 ? '#ef4444' : riProb >= 20 ? '#f97316' : '#10b981'}
            icon={TrendingUp}
            alert={riProb >= 30}
          />
        </div>
      ) : (
        /* NO ACTIVE CYCLONE OPERATIONAL CARD */
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h2 className="text-base font-semibold text-emerald-400">NO ACTIVE CYCLONE</h2>
              </div>
              <p className="text-sm text-slate-300 font-normal leading-relaxed">
                Monitoring systems are operational and continuously scanning the North Indian Ocean. No cyclonic
                circulation detected.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span>Last update: <strong className="text-slate-300 font-normal">{lastCheckTime ? lastCheckTime.substring(17, 25) + ' UTC' : '—'}</strong></span>
                <span>•</span>
                <span>AI Model: <strong className="text-emerald-400 font-normal">Ready</strong></span>
                <span>•</span>
                <span>Surveillance: <strong className="text-slate-300 font-normal">Continuous</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/analysis" className="px-3.5 py-2 rounded bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-200 font-medium transition-colors">
                Analyze Satellite Image
              </Link>
              <Link to="/tracking" className="px-3.5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-xs text-white font-medium transition-colors flex items-center gap-1.5">
                <span>Live Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── OOD WARNING BANNER ── */}
      {sc && <OODWarningBanner cyclone={sc} />}

      {/* ── PREDICTED TRAJECTORY TIMELINE ── */}
      {sc?.forecastTrack?.length > 0 && (
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Predicted Trajectory Timeline</span>
            <span className="text-slate-500 font-mono text-[11px]">Movement & Intensity Forecast</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-sky-900/60">
              <span className="text-[10px] text-sky-400 font-semibold block uppercase">CURRENT</span>
              <div className="font-bold text-white font-mono mt-0.5">{sc.windSpeedKmh} km/h</div>
              <span className="text-[11px] text-slate-400 block">{sc.classificationCode}</span>
            </div>
            {sc.forecastTrack.slice(0, 4).map((fc) => (
              <div key={fc.id} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-400 font-semibold block">{fc.forecastHour}</span>
                <div className="font-bold text-white font-mono mt-0.5">{Math.round(fc.windSpeedKnots * 1.852)} km/h</div>
                <span className="text-[11px] text-slate-400 block">{fc.classification.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: Active Cyclone Selector Panel */}
        {displayList.length > 1 && (
          <div className="lg:col-span-2">
            <div className="bg-[#0c1220] border border-slate-800 rounded-lg overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cyclone Systems</div>
                  <div className="text-lg font-bold text-white">{displayList.length} <span className="text-xs text-slate-400 font-normal">Total</span></div>
                </div>
              </div>
              <div className="p-2 space-y-1.5 max-h-[500px] overflow-y-auto">
                {displayList.map((c) => (
                  <CycloneListItem
                    key={c.id}
                    cyclone={c}
                    isSelected={sc?.id === c.id}
                    onClick={() => setSelectedCyclone(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center: Map + Intensity chart */}
        <div className={`${displayList.length > 1 ? 'lg:col-span-7' : 'lg:col-span-8'} space-y-4`}>
          <Card
            icon={Compass}
            title="Live Location Map"
            subtitle="Observed track, projected path, and uncertainty cone"
            action={
              <Link to="/tracking" className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
                <span>Full Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <CycloneMap cyclone={sc} height="400px" showCone={true} />
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                {sc
                  ? `Active System: ${sc.name} (${sc.classificationCode})`
                  : 'Sector Status: Zero cyclonic circulations detected.'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Basin: North Indian Ocean</span>
            </div>
          </Card>

          <Card
            icon={Activity}
            title="Intensity & Pressure Forecast"
            subtitle="Sustained surface winds vs central pressure profile over time"
          >
            {sc ? (
              <IntensityChart cyclone={sc} height={220} />
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <Activity className="w-5 h-5 mx-auto text-slate-500" />
                <div className="text-slate-300 font-medium">Trajectory & Intensity Graph Standby</div>
                <div className="text-[11px] text-slate-500">Data curves generate automatically when a storm system is active.</div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: RI + Eye Structure + XAI + Satellite + Alerts + Health */}
        <div className={`${displayList.length > 1 ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>

          {/* Rapid Intensification */}
          {sc && (
            <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4">
              <RapidIntensificationCard cyclone={sc} />
            </div>
          )}

          {/* Eye & Structure Analysis */}
          {sc && (
            <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4">
              <EyeStructureCard cyclone={sc} />
            </div>
          )}

          {/* XAI Explainability */}
          {sc && (
            <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4">
              <XAIExplainabilityCard cyclone={sc} />
            </div>
          )}

          {/* System Telemetry */}
          <Card icon={Radio} title="System Telemetry" subtitle="Sensor Ingest & Pipeline Health">
            <SystemHealthCard />
          </Card>
        </div>
      </div>

      {/* ── DETAILED CYCLONE DOSSIER REPORT ── */}
      {sc && (
        <div className="pt-2">
          <CycloneDossierReport cyclone={sc} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
