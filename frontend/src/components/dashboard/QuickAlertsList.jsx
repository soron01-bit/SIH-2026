import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Badge from '../common/Badge';

export const QuickAlertsList = ({ alerts = [] }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Coastal Sector Bulletins ({alerts.length})
        </span>
        <Link
          to="/alerts"
          className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
        >
          <span>All Bulletins</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-md bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge severity={item.severity} size="sm">
                  {item.severity === 'EXTREME' ? 'HIGH' : item.severity}
                </Badge>
                <span className="text-[11px] font-mono text-slate-400">{item.bulletinNo}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </span>
            </div>

            <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{item.title}</h4>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-300 font-medium">{item.location}</span>
              <span className="text-slate-500">{item.state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickAlertsList;
