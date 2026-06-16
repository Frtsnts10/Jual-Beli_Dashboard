import React from "react";
import { Loader2 } from "lucide-react";

export default function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 animate-pulse hidden sm:inline-block">
            Resolving Preferences...
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="h-48 bg-slate-100 dark:bg-[#0d1322] rounded-lg border border-slate-200/80 dark:border-slate-800/80 animate-pulse shadow-sm" />
          <div className="h-32 bg-slate-100 dark:bg-[#0d1322] rounded-lg border border-slate-200/80 dark:border-slate-800/80 animate-pulse shadow-sm" />
          <div className="h-24 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200/80 dark:border-red-900/40 animate-pulse shadow-sm" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-slate-100 dark:bg-[#0d1322] rounded-lg border border-slate-200/80 dark:border-slate-800/80 animate-pulse shadow-sm" />
        </div>
      </div>
    </div>
  );
}
