import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { DashboardNav } from "@/features/dashboard/components/dashboard-nav";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

export async function generateMetadata({ params }: { params: Promise<{ storeId: string }> }): Promise<Metadata> {
  const { storeId } = await params;
  const storeSnap = await adminDb.collection("stores").doc(storeId).get();
  const storeData = storeSnap.data();
  const storeName = storeData?.name || "Store";
  const logoUrl = storeData?.logo_url;

  const metadata: Metadata = {
    title: {
      template: `%s | ${storeName} | Dashboard`,
      default: `${storeName} | Dashboard`,
    },
  };

  if (logoUrl) {
    metadata.icons = {
      icon: logoUrl,
      apple: logoUrl,
    };
  }

  return metadata;
}

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
      .get(),
    getSubscriptionStatus()
  ]);

  const stores = storesSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  const currentStoreIndex = stores.findIndex((s: any) => s.id === storeId);
  const currentStore = stores[currentStoreIndex];

  if (!currentStore) {
    redirect("/dashboard");
  }

  const maxStores = 
    subscription.interval === "lifetime" ? Infinity :
    subscription.interval === "yearly" ? 15 :
    subscription.interval === "monthly" ? 8 :
    subscription.interval === "weekly" ? 5 :
    3;

  // If the user tries to access a store beyond their limit, kick them back to the first store
  if (currentStoreIndex >= maxStores && stores.length > 0) {
    redirect(`/${stores[0].id}/dashboard`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-50 dark:bg-[#090d16] font-sans transition-colors">
      <DashboardHeader 
        storeId={storeId}
        profileId={profileId}
        currentStoreSlug={(currentStore as any).slug}
        isSubscribed={subscription.isSubscribed}
        plan={subscription.plan}
        tier={subscription.tier}
        stores={stores}
        maxStores={maxStores}
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
