import React from 'react';
import { Cpu, Database, Radio, Server, CheckCircle2 } from 'lucide-react';
import StatusIndicator from '../common/StatusIndicator';

export const SystemHealthCard = () => {
  return (
    <div className="space-y-3 text-xs">
      <div className="text-slate-300 font-semibold flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          Pipeline Readiness
        </span>
        <StatusIndicator status="active" label="OPERATIONAL" />
      </div>

      {/* Sensor Ingest Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>INSAT-3D/3DR (ISRO MOSDAC)</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-medium">
            Active (15m Ingest)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Model Inference Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-medium">
            Ready
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Trajectory Forecasting Bus</span>
          </div>
          <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-medium">
            Standby
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;
