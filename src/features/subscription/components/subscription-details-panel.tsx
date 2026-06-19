"use client";

import React from "react";
import { useI18n } from "@/hooks/use-i18n";
import { Crown, Calendar, Package } from "lucide-react";

interface SubscriptionDetailsPanelProps {
  isPremium: boolean;
  tier?: string;
  planName?: string;
  activeUntil?: string | null;
}

export function SubscriptionDetailsPanel({ isPremium, tier, planName, activeUntil }: SubscriptionDetailsPanelProps) {
  const { t } = useI18n();

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Crown className="w-4 h-4 text-slate-400" />
          {t.topbar.standard} Status
        </h3>
        <p className="text-xs text-slate-500">You are currently on the free standard tier. Upgrade to unlock premium features.</p>
      </div>
    );
  }

  const formattedDate = activeUntil 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeUntil))
    : 'Lifetime / No Expiration';

  return (
    <div className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg shadow-sm font-sans space-y-4">
      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
        <Crown className="w-4 h-4 text-indigo-500" />
        {t.topbar.proMember} Active
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800">
            <Package className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscription Plan</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{planName || 'Pro Tier'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Until</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
