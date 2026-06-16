import React from "react";
import { Loader2 } from "lucide-react";

export default function SubscriptionLoadingSkeleton() {
  return (
    <div className="space-y-4 font-sans pb-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      </div>

      <div className="h-24 bg-slate-100 dark:bg-[#0d1322] rounded-lg animate-pulse border border-slate-200/60 dark:border-slate-800/80 shadow-sm" />

      <div className="pt-2">
        <div className="flex flex-col items-center justify-center mb-6 space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="flex justify-center mb-8">
          <div className="h-10 w-80 bg-slate-100 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-lg animate-pulse shadow-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-100 dark:bg-[#0d1322] rounded-lg border border-slate-200/80 dark:border-slate-800/80 animate-pulse shadow-sm" />
          <div className="h-96 bg-slate-200 dark:bg-[#0d1322] rounded-lg border border-slate-200/80 dark:border-slate-800/80 animate-pulse shadow-sm" />
        </div>
      </div>
    </div>
  );
}
