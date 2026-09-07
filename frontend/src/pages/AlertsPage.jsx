import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  Filter,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Wind,
  Waves,
  PhoneCall,
  CheckCircle,
  FileText,
} from 'lucide-react';
import alertService from '../services/alertService';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const { data } = await alertService.getAll();
        setAlerts(data || []);
      } catch (err) {
        console.error('Error loading alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((item) => {
    const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
    const matchesActive = !activeOnly || item.isActive;
    const matchesQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeverity && matchesActive && matchesQuery;
  });

  const severityCounts = {
    ALL: alerts.length,
    EXTREME: alerts.filter((a) => a.severity === 'EXTREME').length,
    HIGH: alerts.filter((a) => a.severity === 'HIGH').length,
    MODERATE: alerts.filter((a) => a.severity === 'MODERATE').length,
    LOW: alerts.filter((a) => a.severity === 'LOW').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-meteor-border/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display tracking-wide text-white">
              Coastal Early Warning & Cyclone Bulletins
            </h1>
            <Badge variant="rose" size="sm">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              DISASTER EARLY WARNING
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Standardized Meteorological Warnings • Multi-Level Coastal Hazard Notifications
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-meteor-900/90 border border-meteor-border p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        {/* Severity filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {['ALL', 'EXTREME', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                severityFilter === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm'
                  : 'bg-slate-950 border-meteor-border text-slate-400 hover:text-white'
              }`}
            >
              <span>{lvl}</span>
              <span className="px-1 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {severityCounts[lvl] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Active Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search state, district, or hazard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-meteor-border rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 select-none cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded bg-slate-950 border-meteor-border text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: ALERTS LIST & EMERGENCY DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-slate-950 border border-meteor-border space-y-2">
              <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-200">No Active Coastal Warnings</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All coastal sectors across the North Indian Ocean basin are currently clear under normal meteorological conditions.
              </p>
            </div>
          ) : (
            filteredAlerts.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-xl border transition-all ${
                  item.severity === 'EXTREME'
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : item.severity === 'HIGH'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-meteor-900/90 border-meteor-border'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-meteor-border/60 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge severity={item.severity}>
                      {item.severity} LEVEL
                    </Badge>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {item.bulletinNo}
                    </span>
                    {item.warningColor && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        IMD COLOR CODE: <strong className="text-white">{item.warningColor}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.timestamp).toUTCString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        item.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.isActive ? 'ACTIVE' : 'ARCHIVED'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-3 space-y-3">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Telemetry info boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                      <Wind className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Gale Wind Advisory</span>
                        <span className="text-slate-200">{item.windWarning}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-start gap-2">
                      <Waves className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Sea Condition Hazard</span>
                        <span className="text-slate-200">{item.seaCondition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Sector info */}
                  <div className="pt-3 border-t border-meteor-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.location} ({item.state})</span>
                    </div>

                    <Link
                      to="/tracking"
                      className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>View Sector on Geospatial Map</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Emergency Protocol & Helpline (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            icon={PhoneCall}
            title="Emergency Authority Protocols"
            subtitle="Coastal Disaster Management Hotlines"
          >
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400 block text-[10px]">National Disaster Response Force (NDRF)</span>
                <span className="text-white font-bold text-sm">1078 / 011-24363260</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400 block text-[10px]">Indian Coast Guard Maritime SAR</span>
                <span className="text-cyan-400 font-bold text-sm">1554 (Toll Free Maritime Distress)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-meteor-border space-y-1">
                <span className="text-slate-400 block text-[10px]">State Disaster Emergency Operation (SEOC)</span>
                <span className="text-amber-400 font-bold text-sm">1070 (State Control Room)</span>
              </div>
            </div>
          </Card>

          <Card
            icon={ShieldAlert}
            title="IMD Warning Protocol Guidelines"
            subtitle="Operational Stages of Cyclone Alert"
          >
            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="font-bold text-yellow-400 text-[11px]">1. Cyclone Alert (Yellow)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Issued 48 hours prior to expected commencement of adverse weather.</div>
              </div>

              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="font-bold text-orange-400 text-[11px]">2. Cyclone Warning (Orange)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Issued 24 hours prior to expected commencement of landfall winds.</div>
              </div>

              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="font-bold text-rose-400 text-[11px]">3. Post-Landfall Outlook (Red)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Issued 12 hours prior to landfall until cyclone weakens into a depression.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
