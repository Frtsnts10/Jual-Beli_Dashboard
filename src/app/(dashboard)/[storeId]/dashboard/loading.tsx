import React from "react";
import { Loader2 } from "lucide-react";

export default function TenantStoreLoadingSkeleton() {
  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-300">
      {/* Skeleton Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 animate-pulse hidden sm:inline-block">
            Resolving Toko Streams...
          </span>
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-1/2" />
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 animate-pulse shrink-0" />
            </div>
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-2/3" />
            <div className="h-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg animate-pulse w-1/3 pt-1" />
          </div>
        ))}
      </div>

      {/* Primary Module Table Preview Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-1/4" />
        
        <div className="bg-white dark:bg-[#0d1322] rounded-lg border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 dark:bg-[#0b0f19]/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-1/3" />
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-full" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-2/3" />
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-24 hidden sm:block" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-32 hidden md:block" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
                  <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
