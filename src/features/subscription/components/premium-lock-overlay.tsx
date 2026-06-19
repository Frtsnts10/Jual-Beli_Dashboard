"use client";

import React from "react";
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PremiumLockOverlayProps {
  storeId: string;
  featureName: string;
  description: string;
}

export function PremiumLockOverlay({ storeId, featureName, description }: PremiumLockOverlayProps) {
  return (
    <div className="relative overflow-hidden w-full min-h-[450px] bg-slate-50/50 dark:bg-[#0d1322]/40 border border-slate-200/60 dark:border-slate-800/80 rounded-lg p-8 flex flex-col items-center justify-center text-center shadow-inner font-sans transition-all">
      {/* Dynamic ambient spotlights in the background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-lg space-y-6 flex flex-col items-center">
        {/* Elastic floating badge with double ring */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200/80 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 shadow-md animate-bounce-once">
          <Lock className="w-6 h-6" />
          <div className="absolute -bottom-1 -right-1 p-1 bg-violet-600 text-white rounded-full shadow-sm">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Dynamic header typography */}
        <div className="space-y-2">
          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 rounded-full">
            Pro Matrix Feature
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {featureName} Access Locked
          </h2>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
          {description}
        </p>

        {/* Feature benefits checkmarks list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full max-w-md pt-4 pb-2 border-t border-slate-100 dark:border-slate-800">
          {[
            "Real-time PostgreSQL webhook syncs",
            "Unlimited multitenant store toko",
            "Advanced @tanstack telemetry tools",
            "Priority customer desk SLA triggers",
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Shiny Conversion Call-to-action */}
        <Link
          href={`/${storeId}/subscription`}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <span>Upgrade to Shop Dashboard Pro</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
