import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 text-slate-500 text-xs mt-auto bg-white dark:bg-[#080c15] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            CYCLONEX
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-600 dark:text-slate-400">North Indian Ocean Meteorological Monitoring</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">
          <span>Standards: IMD / RSMC New Delhi</span>
          <span>•</span>
          <span>© 2026 CYCLONEX</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
