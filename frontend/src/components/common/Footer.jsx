import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-meteor-border/60 py-5 text-slate-500 text-xs mt-auto bg-meteor-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-display font-bold text-slate-200 tracking-wider">
            CYCLONE<span className="text-cyan-400">X</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>Smart India Hackathon 2026</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SYSTEM STANDBY
          </span>
          <span>•</span>
          <span>© 2026 CYCLONEX</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
