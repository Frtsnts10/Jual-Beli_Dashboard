"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Application Global Exception Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl p-8 text-center shadow-2xl shadow-rose-500/5">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />
        
        {/* Icon Frame */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 ring-8 ring-rose-50/50 dark:ring-rose-500/5 animate-pulse">
          <AlertTriangle className="h-8 w-8 stroke-[2.5]" />
        </div>

        {/* Header content */}
        <h2 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Application Exception Encountered
        </h2>
        
        <p className="mb-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          An unexpected interruption occurred while loading this view. You can retry regenerating the module hierarchy or return back to the active console layout safely.
        </p>

        {/* Tech snippet view */}
        {error?.message && (
          <div className="mb-6 max-h-24 overflow-y-auto rounded-lg bg-slate-50 dark:bg-[#06090f] border border-slate-100 dark:border-slate-800/60 p-2.5 text-left text-[11px] font-mono text-rose-600 dark:text-rose-400/90 scrollbar-thin">
            <span className="font-semibold block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Diagnostic Output:</span>
            {error.message}
          </div>
        )}

        {/* Action Button layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 hover:bg-slate-800 dark:hover:bg-white transition-all duration-200 active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
            Attempt Recovery
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 active:scale-[0.98]"
          >
            <Home className="h-3.5 w-3.5" />
            Console Root
          </button>
        </div>
      </div>
    </div>
  );
}
