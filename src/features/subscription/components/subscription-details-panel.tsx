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
      <div className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-stone-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
          <Crown className="w-4 h-4 text-stone-400" />
          {t.topbar.standard} Status
        </h3>
        <p className="text-xs text-stone-500">{t.subscription.freeTierStatus}</p>
      </div>
    );
  }

  const formattedDate = activeUntil 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeUntil))
    : t.subscription.lifetimeExpiration;

  return (
    <div className="p-4 sm:p-6 bg-blue-50 dark:bg-indigo-900/10 border border-blue-100 dark:border-indigo-500/20 rounded-lg shadow-sm font-sans space-y-4">
      <h3 className="text-sm font-bold text-blue-900 dark:text-indigo-100 flex items-center gap-2">
        <Crown className="w-4 h-4 text-blue-500" />
        {t.topbar.proMember} Active
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800">
            <Package className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t.subscription.subscriptionPlanTitle}</p>
            <p className="text-xs font-semibold text-stone-700 dark:text-slate-300">{planName || t.subscription.planNameDefault}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-white dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t.subscription.activeUntilTitle}</p>
            <p className="text-xs font-semibold text-stone-700 dark:text-slate-300">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
