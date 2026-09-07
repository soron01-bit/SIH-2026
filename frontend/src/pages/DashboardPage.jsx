import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Wind,
  Gauge,
  MapPin,
  ShieldAlert,
  Percent,
  Compass,
  Layers,
  ChevronRight,
  Radio,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import alertService from '../services/alertService';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import StatusIndicator from '../components/common/StatusIndicator';
import CycloneMap from '../components/map/CycloneMap';
import IntensityChart from '../components/dashboard/IntensityChart';
import SatellitePreviewCard from '../components/dashboard/SatellitePreviewCard';
import QuickAlertsList from '../components/dashboard/QuickAlertsList';
import SystemHealthCard from '../components/dashboard/SystemHealthCard';

export const DashboardPage = () => {
  const [cyclones, setCyclones] = useState([]);
  const [selectedCyclone, setSelectedCyclone] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('Error fetching telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">CONNECTING TO MISSION MONITOR...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-meteor-border/80 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display tracking-wide text-white">
              Tropical Cyclone Command Center
            </h1>
            <Badge variant="cyan" size="sm">
              NORTH INDIAN OCEAN
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Automated Satellite Ingest & Deep Learning Cyclone Identification Pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-meteor-border px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <StatusIndicator status="standby" label="MONITORING STANDBY" />
          </div>
        </div>
      </div>

      {/* PRIMARY METRICS BAR */}
      {selectedCyclone ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            label="Detected Storm"
            value={selectedCyclone.name}
            unit={selectedCyclone.classificationCode}
            subtext={selectedCyclone.basin}
            icon={Radio}
            accent="cyan"
            badge={<Badge severity={selectedCyclone.riskLevel}>{selectedCyclone.riskLevel}</Badge>}
          />
          <StatCard
            label="Classification"
            value={selectedCyclone.classificationCode}
            subtext={selectedCyclone.classification}
            icon={Activity}
            accent="purple"
          />
          <StatCard
            label="Max Sustained Wind"
            value={selectedCyclone.windSpeedKnots}
            unit="kt"
            subtext={`${selectedCyclone.windSpeedKmh} km/h`}
            icon={Wind}
            accent="rose"
          />
          <StatCard
            label="Central Pressure"
            value={selectedCyclone.pressureHpa}
            unit="hPa"
            subtext="Barometric Depth"
            icon={Gauge}
            accent="amber"
          />
          <StatCard
            label="Eye Location"
            value={`${selectedCyclone.latitude.toFixed(1)}°N`}
            unit={`${selectedCyclone.longitude.toFixed(1)}°E`}
            subtext={`Moving ${selectedCyclone.movementDirection}`}
            icon={MapPin}
            accent="cyan"
          />
          <StatCard
            label="AI Confidence"
            value={`${selectedCyclone.detectionConfidence}%`}
            subtext="Signal Quality"
            icon={Percent}
            accent="emerald"
          />
        </div>
      ) : (
        /* CLEAN STATE: NO FAKE DATA, AWAITING AI MODEL */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Cyclones Detected"
            value="0"
            subtext="Basins Currently Clear"
            icon={ShieldCheck}
            accent="emerald"
            badge={<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ALL CLEAR</span>}
          />
          <StatCard
            label="Monitored Basins"
            value="2"
            subtext="Bay of Bengal & Arabian Sea"
            icon={Radio}
            accent="cyan"
          />
          <StatCard
            label="Sensor Ingest Link"
            value="Ready"
            subtext="INSAT-3D/3DR Protocol"
            icon={Layers}
            accent="purple"
          />
          <StatCard
            label="AI Inference Engine"
            value="Ready"
            subtext="Ready to connect model next"
            icon={Activity}
            accent="amber"
          />
        </div>
      )}

      {/* TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Map & Intensity (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card
            icon={Compass}
            title="Geospatial Satellite Monitoring Map"
            subtitle="Real-time ocean basin tracking & cone of uncertainty"
            action={
              <Link
                to="/tracking"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Expanded Map</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            }
          >
            <CycloneMap cyclone={selectedCyclone} height="440px" showCone={true} />
            <div className="mt-3 pt-3 border-t border-meteor-border/60 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>
                {selectedCyclone
                  ? `Active System: ${selectedCyclone.name} (${selectedCyclone.classificationCode})`
                  : 'Status: No active tropical cyclones detected in monitored ocean sectors.'}
              </span>
              <span className="text-slate-500">INSAT / NOAA Tile Grid</span>
            </div>
          </Card>

          {/* Intensity Evolution */}
          <Card
            icon={Activity}
            title="Intensity Evolution & Temporal Forecast"
            subtitle="Observed vs Model-Projected Winds and Pressure Drop"
          >
            {selectedCyclone ? (
              <IntensityChart cyclone={selectedCyclone} height={260} />
            ) : (
              <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-1">
                <Activity className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                <div className="text-slate-400 font-semibold">No Active Storm Intensity to Graph</div>
                <div>Intensity curves will plot automatically when a cyclone is detected by the AI model.</div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Satellite Stream & Alerts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Satellite Viewport Preview */}
          <Card
            icon={Layers}
            title="Satellite Feed Viewport"
            subtitle="INSAT-3DR Multispectral Stream"
          >
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-meteor-border bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-2 text-xs font-mono text-slate-400">
                  <Layers className="w-8 h-8 mx-auto text-cyan-400/80" />
                  <div className="text-slate-200 font-semibold">Satellite Stream Standby</div>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Upload new satellite imagery in the AI Analysis studio to run pattern identification.
                  </p>
                  <Link
                    to="/analysis"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold pt-1"
                  >
                    <span>Open AI Analysis Studio</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Coastal Alerts */}
          <Card
            icon={ShieldAlert}
            title="Coastal Sector Advisories"
            subtitle="Disaster Management Early Warning Feed"
          >
            {alerts.length > 0 ? (
              <QuickAlertsList alerts={alerts} />
            ) : (
              <div className="py-8 text-center text-xs font-mono text-slate-500 space-y-1.5">
                <ShieldCheck className="w-7 h-7 text-emerald-500/80 mx-auto" />
                <div className="text-slate-300 font-semibold">No Active Coastal Warnings</div>
                <div className="text-[11px] text-slate-500">All coastal districts are currently in normal condition.</div>
              </div>
            )}
          </Card>

          {/* Sensor & Pipeline Health */}
          <Card
            icon={Radio}
            title="Sensor & Model Telemetry"
            subtitle="System Readiness"
          >
            <SystemHealthCard />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
