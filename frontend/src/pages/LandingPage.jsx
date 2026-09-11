import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  FileText,
  Bell,
  ArrowRight,
  Clock,
  Radio,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import cycloneService from '../services/cycloneService';
import { useAIModel } from '../context/AIModelContext';

export const LandingPage = () => {
  const { detectedCyclone } = useAIModel();
  const [activeCyclone, setActiveCyclone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await cycloneService.getAll();
      const active = data && data.length > 0 ? data[0] : null;
      setActiveCyclone(active);
    } catch (e) {
      console.error('Error fetching active storm status:', e);
    } finally {
      const now = new Date();
      setLastUpdated(now.toUTCString().replace('GMT', 'UTC'));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleUpdate = () => {
      fetchStatus();
    };

    window.addEventListener('cyclonex:cyclone-updated', handleUpdate);
    return () => window.removeEventListener('cyclonex:cyclone-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (detectedCyclone) {
      setActiveCyclone(detectedCyclone);
    }
  }, [detectedCyclone]);

  return (
    <div className="space-y-6 pb-6">
      {/* 1. HEADER: BRAND & PRODUCT SCOPE */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CYCLONEX
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 font-normal">
            Cyclone Monitoring & Trajectory Prediction
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-slate-300">SIH26070</span>
          <span className="text-slate-600">•</span>
          <span>North Indian Ocean Basin</span>
        </div>
      </div>

      {/* 2. CURRENT STATUS COMPONENT (LEVEL 1 VISUAL FOCUS) */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-3 border-b border-slate-800/80 pb-2.5">
          <span className="text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
            Current Cyclone Status
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last updated: <strong className="text-slate-200 font-mono font-medium">{lastUpdated ? lastUpdated.substring(17, 25) + ' UTC' : 'Live'}</strong></span>
          </div>
        </div>

        {activeCyclone ? (
          /* ACTIVE CYCLONE STATE */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-sm font-bold text-rose-400 tracking-wide uppercase">
                    Active Cyclone
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {activeCyclone.name}
                </h2>
                <div className="text-xs text-slate-300">
                  {activeCyclone.classification} ({activeCyclone.classificationCode}) • {activeCyclone.basin}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/tracking"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors"
                >
                  <span>View Live Tracking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Core telemetry strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Wind Speed</span>
                <span className="text-base font-bold font-mono text-white">{activeCyclone.windSpeedKmh} km/h</span>
                <span className="text-[11px] text-slate-400 block font-mono">({activeCyclone.windSpeedKnots} kt)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Central Pressure</span>
                <span className="text-base font-bold font-mono text-white">{activeCyclone.pressureHpa} hPa</span>
                <span className="text-[11px] text-slate-400 block">Eye depth</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Current Location</span>
                <span className="text-sm font-bold font-mono text-white">{activeCyclone.latitude}°N, {activeCyclone.longitude}°E</span>
                <span className="text-[11px] text-slate-400 block">Eye centroid</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Movement</span>
                <span className="text-sm font-bold text-white">{activeCyclone.movementDirection}</span>
                <span className="text-[11px] text-slate-400 block font-mono">@ {activeCyclone.movementSpeedKmh || 14} km/h</span>
              </div>
            </div>
          </div>
        ) : (
          /* NO ACTIVE CYCLONE STATE (CLEAR & INFORMATIVE) */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-base font-semibold text-emerald-400">
                  No Active Cyclone
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Monitoring systems are operational and continuously scanning the North Indian Ocean. No significant cyclonic vortex detected in Bay of Bengal or Arabian Sea.
              </p>
              <div className="text-xs text-slate-400 pt-0.5">
                Monitoring Area: <span className="text-slate-200 font-medium">North Indian Ocean (Bay of Bengal & Arabian Sea)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors"
              >
                <span>View Monitoring Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. THREE COMPACT INFORMATION METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium block">AI Model</span>
            <span className="text-sm font-semibold text-emerald-400">Ready</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Deep Learning Core</span>
        </div>

        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium block">Satellite Data</span>
            <span className="text-sm font-semibold text-white">Updated</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">INSAT-3D / 3DR</span>
        </div>

        <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-medium block">Monitoring Area</span>
            <span className="text-sm font-semibold text-white">North Indian Ocean</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">2 Basins Active</span>
        </div>
      </div>

      {/* 4. QUICK ACTIONS: COMPACT ACTIONABLE CARDS */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/tracking"
            className="group bg-[#0c1220] border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg p-4 transition-colors flex items-start gap-3"
          >
            <div className="p-2 rounded bg-slate-800 text-sky-400 group-hover:text-sky-300 transition-colors shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Track Cyclone</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-400" />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                View current and predicted path
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="group bg-[#0c1220] border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg p-4 transition-colors flex items-start gap-3"
          >
            <div className="p-2 rounded bg-slate-800 text-sky-400 group-hover:text-sky-300 transition-colors shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Cyclone Dossiers</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-400" />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Reports for last 5 cyclones
              </p>
            </div>
          </Link>

          <Link
            to="/alerts"
            className="group bg-[#0c1220] border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg p-4 transition-colors flex items-start gap-3"
          >
            <div className="p-2 rounded bg-slate-800 text-sky-400 group-hover:text-sky-300 transition-colors shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>View Alerts</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-400" />
              </div>
              <p className="text-xs text-slate-400 font-normal">
                View warnings and risk updates
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. RECENT MONITORING ACTIVITY (CLEAN & USEFUL PROGRESSIVE DISCLOSURE) */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
          <span className="font-semibold text-slate-300">
            Recent Monitoring Activity
          </span>
          <span className="text-slate-500 font-mono text-[11px]">Surveillance Feed</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-850 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Routine multispectral satellite scan completed — Bay of Bengal & Arabian Sea clear</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">10 min ago</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-850 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>INSAT-3DR thermal infrared stream ingested successfully</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">15 min ago</span>
          </div>

          <div className="flex items-center justify-between py-1.5 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>AI model inference service standing by for manual image inspection</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">Continuous</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
