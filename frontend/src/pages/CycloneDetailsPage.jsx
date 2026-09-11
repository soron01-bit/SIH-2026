import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Wind,
  Gauge,
  MapPin,
  Compass,
  Download,
  ArrowLeft,
  Eye,
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
import CycloneDossierReport from '../components/dashboard/CycloneDossierReport';

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
      <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading cyclone storm dossier...</span>
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
    <div className="space-y-5 pb-8">
      {/* NAVIGATION BREADCRUMB */}
      <div>
        <Link
          to="/dashboard"
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cyclone Monitoring Dashboard</span>
        </Link>
      </div>

      {/* STORM DOSSIER HEADER */}
      <div className="p-5 rounded-lg bg-[#0c1220] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Cyclone {cyclone.name}
              </h1>
              <Badge severity={cyclone.riskLevel}>
                {cyclone.classificationCode} • {cyclone.riskLevel} RISK
              </Badge>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {cyclone.basin}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Detection Timestamp: {new Date(cyclone.detectedAt).toUTCString()} • Sensor: {cyclone.satelliteSensor || 'INSAT-3DR'}
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="self-start md:self-auto px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs border border-slate-750 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Track CSV</span>
          </button>
        </div>

        {cyclone.summary && (
          <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
            {cyclone.summary}
          </p>
        )}
      </div>

      {/* TELEMETRY METRIC CARDS WITH HUMAN CONTEXT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Classification"
          value={cyclone.classificationCode}
          subtext={cyclone.classification}
          context="IMD 3-minute sustained wind stage."
          icon={Activity}
        />

        <StatCard
          label="Max Sustained Winds"
          value={cyclone.windSpeedKmh}
          unit="km/h"
          subtext={`${cyclone.windSpeedKnots} knots`}
          context={`Gusts up to ${cyclone.gustsKnots || Math.round(cyclone.windSpeedKnots * 1.2)} kt.`}
          icon={Wind}
        />

        <StatCard
          label="Central Pressure"
          value={cyclone.pressureHpa}
          unit="hPa"
          subtext="Barometric Eye Depth"
          context="Lower pressure indicates deeper eye wall."
          icon={Gauge}
        />

        <StatCard
          label="Coordinates"
          value={`${cyclone.latitude}°N`}
          unit={`${cyclone.longitude}°E`}
          subtext={`Moving ${cyclone.movementDirection} @ ${cyclone.movementSpeedKmh || 14} km/h`}
          context="Eye centroid estimate."
          icon={MapPin}
        />

        <StatCard
          label="Model Confidence"
          value={`${cyclone.detectionConfidence}%`}
          subtext="High Signal Quality"
          context="Multi-sensor pattern certainty."
          icon={CheckCircle2}
        />
      </div>

      {/* CHARTS: WIND SPEED HISTORY & PRESSURE HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Wind Speed History */}
        <Card
          icon={Wind}
          title="Wind Speed Progression (Knots)"
          subtitle="Observed 3-minute average sustained wind evolution"
        >
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="Inter, sans-serif" />
                <YAxis stroke="#0284c7" fontSize={11} fontFamily="JetBrains Mono, monospace" domain={[15, 120]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs">
                          <div className="text-white font-medium">{label}</div>
                          <div className="text-sky-400 font-mono mt-0.5">
                            Winds: {payload[0].value} kt ({Math.round(payload[0].value * 1.852)} km/h)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="wind" stroke="#0284c7" strokeWidth={2} fill="#0284c7" fillOpacity={0.12} />
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
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="Inter, sans-serif" />
                <YAxis stroke="#d97706" fontSize={11} fontFamily="JetBrains Mono, monospace" domain={[930, 1010]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs">
                          <div className="text-white font-medium">{label}</div>
                          <div className="text-amber-400 font-mono mt-0.5">
                            Pressure: {payload[0].value} hPa
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="pressure" stroke="#d97706" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* TRACK MAP & MORPHOLOGICAL STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <Card
            icon={Compass}
            title="Observation Track Map"
            subtitle="Historical coordinates and projected landfall cone"
          >
            <CycloneMap cyclone={cyclone} height="360px" showCone={true} />
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card
            icon={Eye}
            title="Core Morphological Structure"
            subtitle="Eye & Wind Radii Estimates"
          >
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block font-sans text-[11px]">Eye Diameter:</span>
                <div className="text-white font-bold text-sm">
                  {cyclone.eyeRadiusKm ? cyclone.eyeRadiusKm * 2 : 40} km ({cyclone.eyeRadiusKm || 20} km Radius)
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block font-sans text-[11px]">Radius of Max Winds (RMW):</span>
                <div className="text-sky-400 font-bold text-sm">35 km from Eye Center</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block font-sans text-[11px]">Gale Wind Extent (34 kt):</span>
                <div className="text-slate-200">NE: 220 km • SE: 180 km • SW: 140 km • NW: 160 km</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block font-sans text-[11px]">Storm Surge Hazard:</span>
                <div className="text-rose-400 font-bold">1.5 - 2.5 meters above astronomical tide</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* COMPREHENSIVE METEOROLOGICAL DOSSIER REPORT */}
      <CycloneDossierReport cyclone={cyclone} />
    </div>
  );
};

export default CycloneDetailsPage;
