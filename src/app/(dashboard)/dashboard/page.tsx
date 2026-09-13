import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { StoreSwitcher } from "@/features/stores/components/store-switcher";
import { UserButton } from "@/features/auth/components/user-button";

export default async function DashboardRootPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileId = user.uid;

  // Ensure current profile row exists
  const profileRef = adminDb.collection("profiles").doc(profileId);
  const profileDoc = await profileRef.get();
  if (!profileDoc.exists) {
    await profileRef.set({
      id: profileId,
      email: user.email || "owner@premium-console.dev",
      full_name: user.name || "Verified Store Owner",
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || profileId)}`,
      is_premium: false,
      created_at: new Date().toISOString(),
    });
  }

  const storesSnap = await adminDb.collection("stores")
    .where("owner_id", "==", profileId)
    .orderBy("created_at", "asc")
    .limit(1)
    .get();

  if (!storesSnap.empty) {
    redirect(`/${storesSnap.docs[0].id}/dashboard`);
  }

  // If zero stores exist, present explicit provision workflow layout
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <header className="h-16 border-b border-stone-200 bg-white px-8 flex items-center justify-between">
        <span className="font-bold text-stone-800">Shop Dashboard Suite</span>
        <UserButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-lg border border-stone-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            🏪
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1">Welcome to Shop Dashboard Console</h2>
          <p className="text-xs text-stone-500 mb-6 leading-relaxed">
            You don&apos;t have any mapped storefront instances yet. Create your first workspace partition below to unlock live inventory tables and customer CRM vectors.
          </p>
          <div className="flex justify-center">
            <StoreSwitcher stores={[]} profileId={profileId} />
          </div>
          <p className="text-[10px] text-stone-400 mt-4">
            Click the dropdown button above to prompt the Add Workspace window.
          </p>
        </div>
      </main>
    </div>
  );
}
