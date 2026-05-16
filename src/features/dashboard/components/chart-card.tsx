"use client";

import React, { useState } from "react";

interface ChartDataPoint {
  name: string;
  sales: number;
  inventory: number;
}

interface ChartCardProps {
  data?: {
    daily: ChartDataPoint[];
    monthly: ChartDataPoint[];
    yearly: ChartDataPoint[];
  };
}

type ViewMode = "daily" | "monthly" | "yearly";

export function ChartCard({ data }: ChartCardProps) {
  const [view, setView] = useState<ViewMode>("monthly");

  const currentData = data ? data[view] : [];
  
  // Find max value for scaling
  const maxValue = Math.max(...currentData.map(d => Math.max(d.sales, d.inventory)), 10);
  
  return (
    <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm font-sans transition-colors h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Telemetry Performance Mapping</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Transactional velocity vs inventory ingestion</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-sm border border-slate-100 dark:border-slate-800/60">
          {(["daily", "monthly", "yearly"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-[2px] transition-all ${
                view === mode 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/50" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Inventory</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] flex items-end justify-between gap-2 px-2 relative">
        {/* Y-Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-t border-slate-100/50 dark:border-slate-800/30" />
          ))}
        </div>

        {currentData.map((item, idx) => {
          const salesHeight = (item.sales / maxValue) * 100;
          const invHeight = (item.inventory / maxValue) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group z-10">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                {/* Sales Bar */}
                <div 
                  className="w-full max-w-[12px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-[2px] transition-all duration-500 group-hover:brightness-110 relative"
                  style={{ height: `${Math.max(salesHeight, 5)}%` }}
                >
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-sm pointer-events-none whitespace-nowrap">
                    {item.sales} sales
                  </div>
                </div>
                {/* Inventory Bar */}
                <div 
                  className="w-full max-w-[12px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[2px] transition-all duration-500 group-hover:brightness-110 relative"
                  style={{ height: `${Math.max(invHeight, 5)}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-sm pointer-events-none whitespace-nowrap">
                    {item.inventory} items
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate w-full text-center">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
