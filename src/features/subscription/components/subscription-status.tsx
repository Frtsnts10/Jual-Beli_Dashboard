"use client";

import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface SubscriptionStatusProps {
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

export function SubscriptionStatus({ isSubscribed, plan, status, currentPeriodEnd }: SubscriptionStatusProps) {
  return (
    <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm font-sans flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Plan Telemetry Status</span>
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-colors ${
            isSubscribed ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}>
            {status}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
          {plan} Matrix Level
          {isSubscribed && <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        </h3>
        {currentPeriodEnd ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Billing active vector end string: <span className="font-mono font-medium">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
          </p>
        ) : isSubscribed ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active Billing Vector: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Lifetime (Infinite Access)</span>
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/40 to-violet-50 dark:to-violet-950/20 text-indigo-600 dark:text-indigo-400 rounded-sm border border-indigo-100/40 dark:border-indigo-900/40 transition-colors">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">SLA Active Telemetry</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">PostgreSQL hooks synchronized</p>
        </div>
      </div>
    </div>
  );
}
