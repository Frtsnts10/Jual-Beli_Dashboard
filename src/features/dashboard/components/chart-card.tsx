import React from "react";

export function ChartCard() {
  return (
    <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm font-sans transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Telemetry Performance Mapping</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Monthly transactional velocity vs inventory ingestion</p>
        </div>
        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] rounded-sm">
          Live Connection
        </span>
      </div>
      <div className="h-64 w-full rounded-sm bg-gradient-to-tr from-slate-50 dark:from-[#0b0f19] via-white dark:via-[#0d1322] to-slate-50 dark:to-[#0b0f19] border border-slate-100 dark:border-slate-800/60 flex items-center justify-center relative overflow-hidden transition-colors">
        {/* Abstract rich graphic bars */}
        <div className="absolute inset-0 flex items-end justify-between px-8 pt-12 pb-4 opacity-40 dark:opacity-25 pointer-events-none">
          <div className="w-8 bg-indigo-200 rounded-t-sm h-[40%]" />
          <div className="w-8 bg-indigo-300 rounded-t-sm h-[65%]" />
          <div className="w-8 bg-violet-400 rounded-t-sm h-[50%]" />
          <div className="w-8 bg-indigo-400 rounded-t-sm h-[80%]" />
          <div className="w-8 bg-violet-500 rounded-t-sm h-[95%]" />
          <div className="w-8 bg-indigo-600 rounded-t-sm h-[70%]" />
        </div>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-300 z-10 bg-white/80 dark:bg-[#0b0f19]/80 px-3 py-1.5 rounded-sm backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/80">
          Telemetry stream bound successfully to active tenant shard
        </span>
      </div>
    </div>
  );
}
