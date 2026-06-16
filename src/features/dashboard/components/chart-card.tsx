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
  
  // SVG Dimensions
  const width = 1000;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getPoints = (key: "sales" | "inventory") => {
    if (currentData.length === 0) return "";
    return currentData.map((item, i) => {
      const x = padding + (i / (currentData.length - 1)) * chartWidth;
      const val = item[key];
      const y = height - padding - (val / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(" ");
  };

  const getAreaPoints = (key: "sales" | "inventory") => {
    if (currentData.length === 0) return "";
    const points = getPoints(key);
    const lastX = padding + chartWidth;
    return `${padding},${height - padding} ${points} ${lastX},${height - padding}`;
  };

  return (
    <div className="p-7 bg-white dark:bg-[#080c14] rounded-lg border border-slate-100 dark:border-white/5 shadow-2xl shadow-indigo-500/5 font-sans transition-all h-full flex flex-col group overflow-hidden relative">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Telemetry Engine</h3>
            <span className="px-1.5 py-0.5 rounded-[4px] bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">Live</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Transactional velocity vs inventory ingestion vectors.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 pr-6 border-r border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inventory</span>
            </div>
          </div>

          <div className="flex p-1 bg-slate-100/50 dark:bg-white/5 rounded-lg border border-slate-200/50 dark:border-white/5">
            {(["daily", "monthly", "yearly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  view === mode 
                    ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-[260px] flex flex-col justify-end">
        {currentData.length > 0 ? (
          <>
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-full drop-shadow-2xl overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line 
                  key={p}
                  x1={padding}
                  y1={padding + (chartHeight * p)}
                  x2={width - padding}
                  y2={padding + (chartHeight * p)}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-white/5"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Inventory Area & Line */}
              <polyline
                points={getAreaPoints("inventory")}
                fill="url(#invGradient)"
                className="transition-all duration-700"
              />
              <polyline
                points={getPoints("inventory")}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              />

              {/* Sales Area & Line */}
              <polyline
                points={getAreaPoints("sales")}
                fill="url(#salesGradient)"
                className="transition-all duration-700"
              />
              <polyline
                points={getPoints("sales")}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"
              />

              {/* Data Points */}
              {currentData.map((item, i) => {
                const x = padding + (i / (currentData.length - 1)) * chartWidth;
                const sy = height - padding - (item.sales / maxValue) * chartHeight;
                const iy = height - padding - (item.inventory / maxValue) * chartHeight;
                
                return (
                  <g key={i} className="group/point cursor-pointer">
                    <circle cx={x} cy={sy} r="5" fill="#6366f1" className="group-hover/point:r-7 transition-all" />
                    <circle cx={x} cy={iy} r="5" fill="#10b981" className="group-hover/point:r-7 transition-all" />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center px-8 mt-4">
              {currentData.map((item, idx) => (
                <span key={idx} className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter w-12 text-center">
                  {item.name}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-800 gap-3">
             <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <span className="text-xl">📊</span>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest">No Telemetry Payload Detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
