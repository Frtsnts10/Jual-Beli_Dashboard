import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { StoreSwitcher } from "@/features/stores/components/store-switcher";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { MobileNavTrigger } from "@/features/dashboard/components/mobile-nav-trigger";
import { UserButton } from "@/features/auth/components/user-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default async function TenantStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileId = user.id;
  const adminSupabase = await createAdminSupabase();

  const [storesRes, subscription] = await Promise.all([
    adminSupabase
      .from("stores")
      .select("*")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: true }),
    getSubscriptionStatus(storeId)
  ]);

  const stores = storesRes.data;
  const currentStore = stores?.find((s) => s.id === storeId);

  if (!currentStore) {
    redirect("/dashboard");
  }

  const displayStores = stores || [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#090d16] font-sans transition-colors">
      {/* Premium Multi-Tenant Top Bar Navigation */}
      <header className="shrink-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] px-4 transition-all">
        <div className="flex items-center gap-2">
          <MobileNavTrigger />
          <StoreSwitcher stores={displayStores} profileId={profileId} />
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Shard: {currentStore.slug}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Dynamic Tier Status Badge - hidden on small mobile viewports to prevent layout crowding */}
          {subscription.isSubscribed ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 border border-indigo-500/20 dark:border-indigo-900/40 rounded-sm text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 shadow-sm animate-pulse-slow">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              Pro Member
            </span>
          ) : (
            <Link 
              href={`/${storeId}/subscription`} 
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all active:scale-95 group shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Standard</span>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">Upgrade</span>
            </Link>
          )}

          <NotificationBell storeId={storeId} />
          <UserButton />
        </div>
      </header>

      {/* Main Framework Viewport */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
