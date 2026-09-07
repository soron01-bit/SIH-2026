import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';
import Badge from '../common/Badge';

export const QuickAlertsList = ({ alerts = [] }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Bell className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Coastal Bulletins & Warnings</span>
        </div>
        <Link
          to="/alerts"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
        >
          <span>All Bulletins</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-slate-950/60 border border-meteor-border hover:border-slate-700 transition-all flex flex-col gap-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge severity={item.severity} size="sm">
                  {item.severity}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400">{item.bulletinNo}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </span>
            </div>

            <h4 className="text-xs font-medium text-slate-100 line-clamp-1">{item.title}</h4>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            <div className="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-cyan-400/90">{item.location}</span>
              <span className="text-slate-500">{item.state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickAlertsList;
