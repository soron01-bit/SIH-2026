import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Radar,
  Layers,
  MapPin,
  ArrowRight,
  Eye,
  Radio,
  Compass,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export const LandingPage = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-10 pb-12 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Smart India Hackathon 2026 • Problem Statement SIH26070</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
            AI-Powered Tropical Cyclone <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Monitoring, Identification & Trajectory Prediction
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            A next-generation meteorological situational awareness platform utilizing multi-spectral satellite imagery (INSAT-3D/3DR, NOAA) with deep learning for automated cyclonic pattern detection, intensity classification, and trajectory forecasting.
          </p>

          {/* Call to Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
            >
              <Activity className="w-4 h-4" />
              <span>Open Monitoring Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/analysis"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-meteor-border text-slate-200 font-medium text-sm hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Launch AI Satellite Studio</span>
            </Link>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-meteor-border">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Monitored Basin</span>
              <span className="text-sm font-semibold text-white font-mono">North Indian Ocean</span>
              <span className="text-[10px] text-cyan-400 block mt-0.5">Bay of Bengal & Arabian Sea</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-meteor-border">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Satellite Sensor</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono">INSAT-3D/3DR</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ISRO MOSDAC Stream</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-meteor-border">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Classification</span>
              <span className="text-sm font-semibold text-amber-400 font-mono">IMD Standard</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Depression to Super Cyclone</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-meteor-border">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">AI Inference</span>
              <span className="text-sm font-semibold text-purple-400 font-mono">Deep Learning Core</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pattern & Trajectory</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="cyan">Core Capabilities</Badge>
          <h2 className="text-2xl font-bold font-display text-white">
            Automated Cyclone Detection & Decision Support
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            icon={Eye}
            title="Pattern Identification"
            subtitle="Deep learning feature extraction"
          >
            <p className="text-xs text-slate-300 leading-relaxed">
              Detects early cyclonic circulation, central dense overcast (CDO), and eye formations from Thermal IR (10.8 µm) and Water Vapor (6.7 µm) channels.
            </p>
          </Card>

          <Card
            icon={Activity}
            title="Intensity Classification"
            subtitle="IMD storm categorization"
          >
            <p className="text-xs text-slate-300 leading-relaxed">
              Estimates maximum sustained surface wind speeds (knots / km/h) and central barometric pressure (hPa) drop, classifying storms from Deep Depression to Super Cyclone.
            </p>
          </Card>

          <Card
            icon={MapPin}
            title="Trajectory Forecasting"
            subtitle="Geospatial track & cone of uncertainty"
          >
            <p className="text-xs text-slate-300 leading-relaxed">
              Maps historical observation tracks coupled with projected movement vectors and dynamic cone-of-uncertainty polygons for coastal landfall planning.
            </p>
          </Card>
        </div>
      </section>

      {/* SATELLITE BAND UTILIZATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-meteor-900 to-slate-950 border border-meteor-border space-y-4">
          <div className="border-b border-meteor-border/60 pb-4">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
              Multi-Spectral Satellite Ingest
            </span>
            <h3 className="text-xl font-bold font-display text-white mt-1">
              Multi-Channel Remote Sensing
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="font-semibold text-cyan-300">Thermal Infrared (TIR1 - 10.8 µm)</h4>
              <p className="text-slate-400 leading-relaxed">
                24/7 cloud top temperature measurement. Cold cloud tops reveal intense eyewall updrafts and deep cyclonic spiraling through the night.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="font-semibold text-purple-300">Water Vapor Channel (WV - 6.7 µm)</h4>
              <p className="text-slate-400 leading-relaxed">
                Captures mid-to-upper tropospheric moisture advection. Tracks environmental steering flows and dry air intrusions.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="font-semibold text-amber-300">Visible Spectrum (VIS - 0.65 µm)</h4>
              <p className="text-slate-400 leading-relaxed">
                Provides daylight structural textures of low-level cloud centers, cirrus outflow streaks, and pin-hole eye structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK CTA BANNER */}
      <section className="max-w-3xl mx-auto px-4 text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
          Launch Tropical Cyclone Command Center
        </h3>
        <p className="text-xs text-slate-400">
          Monitor real-time active storm tracks, review intensity evolution curves, or upload satellite imagery for AI inference.
        </p>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Compass className="w-4 h-4" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
