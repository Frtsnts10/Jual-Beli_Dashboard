import React from "react";

export default function CarouselLoadingSkeleton() {
  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300 pt-2">
      <div className="space-y-2 w-full max-w-sm">
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-full" />
      </div>

      <div className="bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm h-64 animate-pulse" />

      <div className="bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 p-6 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="w-32 h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
