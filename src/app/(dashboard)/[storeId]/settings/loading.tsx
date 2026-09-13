import React from "react";
import { Loader2 } from "lucide-react";

export default function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6 font-sans max-w-full pb-12 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800/60">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-6 bg-stone-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-stone-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-xs font-bold text-stone-400 dark:text-slate-500 animate-pulse hidden sm:inline-block">
            Resolving Preferences...
          </span>
        </div>
      </div>

      {/* Grid Match */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column Skeleton */}
        <div className="flex flex-col gap-6 h-full">
          {/* Tenant Form */}
          <div className="h-[420px] bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 animate-pulse shadow-sm" />
          {/* Preferences Form */}
          <div className="h-[220px] bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 animate-pulse shadow-sm" />
          {/* Integrations Form */}
          <div className="h-[280px] bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 animate-pulse shadow-sm" />
        </div>

        {/* Right Column Skeleton */}
        <div className="flex flex-col gap-6 h-full">
          {/* Profile Form */}
          <div className="h-[460px] bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 animate-pulse shadow-sm" />
          {/* Appearance Panel */}
          <div className="h-[120px] bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 animate-pulse shadow-sm" />
          {/* Danger Zone Panel */}
          <div className="h-[160px] bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/40 animate-pulse shadow-sm" />
        </div>
      </div>
    </div>
  );
}
