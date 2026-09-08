import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Wind,
  Waves,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Info,
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
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Coastal Early Warning & Bulletins
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard India Meteorological Department (IMD) 4-stage warnings and disaster management sector notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-850 text-slate-300 border border-slate-700">
            Disaster Management Feed
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-[#0c1220] border border-slate-800 p-3.5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Severity filter pills with clean semantic meaning */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'EXTREME', label: '🔴 HIGH' },
            { id: 'HIGH', label: '🟠 WARNING' },
            { id: 'MODERATE', label: '🟡 WATCH' },
            { id: 'LOW', label: '🟢 INFORMATION' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSeverityFilter(lvl.id)}
              className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
                severityFilter === lvl.id
                  ? 'bg-slate-800 text-white border-slate-700 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{lvl.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-850 text-[10px] text-slate-400 font-mono">
                {severityCounts[lvl.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Active Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search state or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600 text-xs"
            />
          </div>

          <label className="flex items-center gap-1.5 text-slate-300 select-none cursor-pointer whitespace-nowrap text-xs">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: ALERTS LIST & EMERGENCY DIRECTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Alerts List (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-14 text-center rounded-lg bg-[#0c1220] border border-slate-800 space-y-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-200">No Active Coastal Warnings</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All coastal sectors across the North Indian Ocean basin are currently clear under normal meteorological conditions.
              </p>
            </div>
          ) : (
            filteredAlerts.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-colors bg-[#0c1220] ${
                  item.severity === 'EXTREME'
                    ? 'border-rose-800/80 bg-rose-950/10'
                    : item.severity === 'HIGH'
                    ? 'border-orange-800/80 bg-orange-950/10'
                    : item.severity === 'MODERATE'
                    ? 'border-amber-800/80 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge severity={item.severity}>
                      {item.severity === 'EXTREME' ? '🔴 HIGH' : item.severity === 'HIGH' ? '🟠 WARNING' : item.severity === 'MODERATE' ? '🟡 WATCH' : '🟢 INFORMATION'}
                    </Badge>
                    <span className="text-xs font-mono font-medium text-slate-300">
                      {item.bulletinNo}
                    </span>
                    {item.warningColor && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-400">
                        IMD: {item.warningColor}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(item.timestamp).toUTCString()}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-2.5 space-y-2">
                  <h3 className="text-sm font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Wind warning & sea condition */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start gap-2">
                      <Wind className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-medium block">Gale Wind Warning</span>
                        <span className="text-slate-200">{item.windWarning}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start gap-2">
                      <Waves className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-medium block">Sea Condition</span>
                        <span className="text-slate-200">{item.seaCondition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Sector info */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{item.location} ({item.state})</span>
                    </div>

                    <Link
                      to="/tracking"
                      className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 text-xs"
                    >
                      <span>View on Tracking Map</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Emergency Protocol & Guidelines (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            icon={PhoneCall}
            title="Emergency Control Rooms"
            subtitle="National & Coastal Disaster Helplines"
          >
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[11px]">National Disaster Response Force (NDRF)</span>
                <span className="text-white font-bold font-mono text-sm">1078 / 011-24363260</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[11px]">Indian Coast Guard Maritime SAR</span>
                <span className="text-sky-400 font-bold font-mono text-sm">1554 (Toll Free Distress)</span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[11px]">State Emergency Operations (SEOC)</span>
                <span className="text-amber-400 font-bold font-mono text-sm">1070 (State Control Room)</span>
              </div>
            </div>
          </Card>

          <Card
            icon={Info}
            title="IMD 4-Stage Warning Protocol"
            subtitle="Standardized Meteorological Phases"
          >
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <div className="font-semibold text-yellow-400">1. Cyclone Alert (Yellow)</div>
                <div className="text-[11px] text-slate-400">Issued at least 48 hours prior to the expected commencement of adverse weather.</div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <div className="font-semibold text-orange-400">2. Cyclone Warning (Orange)</div>
                <div className="text-[11px] text-slate-400">Issued at least 24 hours prior to expected commencement of squally/gale winds.</div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
                <div className="font-semibold text-rose-400">3. Post-Landfall Outlook (Red)</div>
                <div className="text-[11px] text-slate-400">Issued at least 12 hours prior to landfall until the system dissipates into depression.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
