import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Database, Cpu, Radio, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-meteor-950 border-t border-meteor-border mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Project Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white text-base tracking-wider">
                CYCLONE<span className="text-cyan-400">X</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                SIH26070
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              AI/ML-based system for identification, classification, and trajectory prediction of tropical cyclone patterns using multi-source satellite data.
            </p>
            <div className="pt-2 flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart India Hackathon 2026</span>
            </div>
          </div>

          {/* Col 2: Satellite & Data Protocols */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Target Satellite Sources
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>ISRO MOSDAC (INSAT-3D / 3DR)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>NOAA IBTrACS Cyclone Archive</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>NASA GPM IMERG Precipitation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>IMD RSMC Tropical Cyclone Reports</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture Stack */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              System Architecture
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>Frontend: React 18 + Vite + Tailwind CSS</li>
              <li>Mapping: Leaflet + CartoDB DarkMatter</li>
              <li>Backend Target: Django REST Framework</li>
              <li>Database Target: PostgreSQL</li>
              <li>Future ML: PyTorch (ResNet/EfficientNet + GRU)</li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation & Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Mission Control Links
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-slate-400">
              <Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
              <Link to="/analysis" className="hover:text-cyan-400 transition-colors">Analysis</Link>
              <Link to="/tracking" className="hover:text-cyan-400 transition-colors">Tracking</Link>
              <Link to="/alerts" className="hover:text-cyan-400 transition-colors">Alerts</Link>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 mt-2">
              <strong className="text-amber-400 block mb-0.5">Disclaimer:</strong>
              Current build is running in Phase 1 demonstration mode. Simulated storm trajectories and demo bulletins are provided for platform validation.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-meteor-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 CYCLONEX System. Built for Smart India Hackathon (Problem Statement SIH26070).
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>PHASE 1 COMPLETE</span>
            <span>•</span>
            <span>PHASE 2 READY</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
