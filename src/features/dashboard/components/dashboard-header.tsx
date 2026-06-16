"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MobileNavTrigger } from "./mobile-nav-trigger";
import { StoreSwitcher } from "@/features/stores/components/store-switcher";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { UserButton } from "@/features/auth/components/user-button";
import { useI18n } from "@/hooks/use-i18n";

interface DashboardHeaderProps {
  storeId: string;
  profileId: string;
  currentStoreSlug: string;
  isSubscribed: boolean;
  plan?: string;
  tier?: string;
  stores: any[];
  stores: any[];
}

export function DashboardHeader({
  storeId,
  profileId,
  currentStoreSlug,
  isSubscribed,
  plan,
  tier,
  stores
}: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="shrink-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] px-4 transition-all">
      <div className="flex items-center gap-2">
        <MobileNavTrigger />
        <StoreSwitcher stores={stores} profileId={profileId} />
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t.topbar.activeShard}: {currentStoreSlug}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 border border-indigo-500/20 dark:border-indigo-900/40 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 shadow-sm animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            {tier === "plus" ? "PLUS MEMBER" : t.topbar.proMember}
          </span>
        ) : (
          <Link 
            href={`/${storeId}/subscription`} 
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all active:scale-95 group shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{t.topbar.standard}</span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">{t.topbar.upgrade}</span>
          </Link>
        )}

        <NotificationBell storeId={storeId} />
        <UserButton />
      </div>
    </header>
  );
}
