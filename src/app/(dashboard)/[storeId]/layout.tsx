import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

export default async function TenantStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileId = user.uid;

  const [storesSnap, subscription] = await Promise.all([
    adminDb.collection("stores")
      .where("owner_id", "==", profileId)
      .orderBy("created_at", { descending: false })
      .get(),
    getSubscriptionStatus(storeId)
  ]);

  const stores = storesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const currentStore = stores.find((s: any) => s.id === storeId);

  if (!currentStore) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#090d16] font-sans transition-colors">
      <DashboardHeader 
        storeId={storeId}
        profileId={profileId}
        currentStoreSlug={(currentStore as any).slug}
        isSubscribed={subscription.isSubscribed}
        stores={stores}
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
