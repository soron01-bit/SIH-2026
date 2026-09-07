import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Wind,
  Gauge,
  MapPin,
  Compass,
  Clock,
  Download,
  Share2,
  Calendar,
  Layers,
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import cycloneService from '../services/cycloneService';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import CycloneMap from '../components/map/CycloneMap';

export const CycloneDetailsPage = () => {
  const { id } = useParams();
  const [cyclone, setCyclone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorm = async () => {
      setLoading(true);
      try {
        const stormId = id || 'cyclone-active-01';
        const { data } = await cycloneService.getById(stormId);
        setCyclone(data);
      } catch (err) {
        console.error('Error fetching cyclone details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorm();
  }, [id]);

  if (loading || !cyclone) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">RETRIEVING STORM DOSSIER...</span>
      </div>
    );
  }

  // Prep chart data
  const historicalData = (cyclone.historicalTrack || []).map((pt) => ({
    time: new Date(pt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
    wind: pt.windSpeedKnots,
    windKmh: Math.round(pt.windSpeedKnots * 1.852),
    pressure: pt.pressureHpa,
    classification: pt.classification,
  }));

  // Append current observation
  historicalData.push({
    time: 'Current Eye',
    wind: cyclone.windSpeedKnots,
    windKmh: cyclone.windSpeedKmh,
    pressure: cyclone.pressureHpa,
    classification: cyclone.classification,
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp,Latitude,Longitude,Wind_kt,Wind_kmh,Pressure_hPa,Classification\n'];
    const rows = (cyclone.historicalTrack || []).map(
      (pt) => `${pt.timestamp},${pt.latitude},${pt.longitude},${pt.windSpeedKnots},${Math.round(pt.windSpeedKnots * 1.852)},${pt.pressureHpa},${pt.classification}\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cyclone.name}_track_data.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* NAVIGATION CRUMBS */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      {/* STORM DOSSIER HEADER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-meteor-900 to-slate-950 border border-meteor-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-wider">
                CYCLONE {cyclone.name}
              </h1>
              <Badge severity={cyclone.riskLevel}>
                {cyclone.classificationCode} • {cyclone.riskLevel} RISK
              </Badge>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {cyclone.basin}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Detection Timestamp: {new Date(cyclone.detectedAt).toUTCString()} • Sensor: {cyclone.satelliteSensor}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl pt-2 border-t border-meteor-border/60">
          {cyclone.summary}
        </p>
      </div>

      {/* TELEMETRY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Classification"
          value={cyclone.classificationCode}
          subtext={cyclone.classification}
          icon={Activity}
          accent="purple"
        />

        <StatCard
          label="Sustained Winds"
          value={cyclone.windSpeedKnots}
          unit="kt"
          subtext={`${cyclone.windSpeedKmh} km/h • Gusts ${cyclone.gustsKnots || 75} kt`}
          icon={Wind}
          accent="rose"
        />

        <StatCard
          label="Central Pressure"
          value={cyclone.pressureHpa}
          unit="hPa"
          subtext="Barometric Eye Depth"
          icon={Gauge}
          accent="amber"
        />

        <StatCard
          label="Current Coordinates"
          value={`${cyclone.latitude}°N`}
          unit={`${cyclone.longitude}°E`}
          subtext={`Vector: ${cyclone.movementDirection} @ ${cyclone.movementSpeedKmh} km/h`}
          icon={MapPin}
          accent="cyan"
        />

        <StatCard
          label="Model Confidence"
          value={`${cyclone.detectionConfidence}%`}
          subtext="Sensor Signal-to-Noise"
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      {/* CHARTS: WIND SPEED HISTORY & PRESSURE HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Wind Speed History */}
        <Card
          icon={Wind}
          title="Wind Speed Progression (Knots)"
          subtitle="Observed 3-minute average sustained wind evolution"
        >
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="windDetailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f4a" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#06b6d4" fontSize={10} fontFamily="JetBrains Mono" domain={[15, 120]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded text-xs font-mono">
                          <div className="text-cyan-400 font-bold">{label}</div>
                          <div className="text-white mt-1">
                            Winds: <span className="font-bold">{payload[0].value} kt</span> ({Math.round(payload[0].value * 1.852)} km/h)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="wind" stroke="#06b6d4" strokeWidth={2} fill="url(#windDetailGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Pressure History */}
        <Card
          icon={Gauge}
          title="Central Pressure Profile (hPa)"
          subtitle="Barometric eye depressurization trend"
        >
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f4a" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#f59e0b" fontSize={10} fontFamily="JetBrains Mono" domain={[930, 1010]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded text-xs font-mono">
                          <div className="text-amber-400 font-bold">{label}</div>
                          <div className="text-white mt-1">
                            Pressure: <span className="font-bold">{payload[0].value} hPa</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="pressure" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* TRACK INFORMATION & RADIAL WIND STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card
            icon={Compass}
            title="Observation Track Map"
            subtitle="Historical coordinates and projected landfall cone"
          >
            <CycloneMap cyclone={cyclone} height="380px" showCone={true} />
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card
            icon={Eye}
            title="Core Morphological Structure"
            subtitle="Eye & Wind Radii Estimates"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400">Eye Diameter:</span>
                <div className="text-white font-bold text-sm">
                  {cyclone.eyeRadiusKm * 2} km ({cyclone.eyeRadiusKm} km Radius)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400">Radius of Max Winds (RMW):</span>
                <div className="text-cyan-400 font-bold text-sm">35 km from Eye Center</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400">Gale Wind Extent (34 kt):</span>
                <div className="text-slate-200">NE: 220 km • SE: 180 km • SW: 140 km • NW: 160 km</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400">Storm Surge Hazard:</span>
                <div className="text-rose-400 font-bold">1.5 - 2.5 meters above tide</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CycloneDetailsPage;
