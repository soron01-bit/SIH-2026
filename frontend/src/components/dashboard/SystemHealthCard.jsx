import React from 'react';
import { Cpu, Database, Radio, Server, CheckCircle2 } from 'lucide-react';
import StatusIndicator from '../common/StatusIndicator';

export const SystemHealthCard = () => {
  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="text-slate-300 font-bold flex items-center justify-between pb-2 border-b border-meteor-border/60">
        <span className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Sensor & AI System Status
        </span>
        <StatusIndicator status="active" label="OPERATIONAL" />
      </div>

      {/* Sensor Ingest Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-meteor-border">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>INSAT-3D/3DR (ISRO MOSDAC)</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
            CONNECTED (15m)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-meteor-border">
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trained AI Inference Engine</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
            ONLINE & ACTIVE
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-meteor-border">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Trajectory Forecasting Bus</span>
          </div>
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;
