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

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

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
      <DashboardHeader 
        storeId={storeId}
        profileId={profileId}
        currentStoreSlug={currentStore.slug}
        isSubscribed={subscription.isSubscribed}
        stores={displayStores}
      />

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
