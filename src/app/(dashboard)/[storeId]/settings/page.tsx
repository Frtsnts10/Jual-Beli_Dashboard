import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Settings",
};

import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { redirect } from "next/navigation";
import { StoreProfileForm } from "@/features/settings/components/store-settings-form";
import { StorePreferencesForm } from "@/features/settings/components/store-preferences-form";
import { DangerZonePanel } from "@/features/settings/components/danger-zone-panel";
import { StoreCredentialsPanel } from "@/features/settings/components/store-credentials-panel";
import { IntegrationsForm } from "@/features/settings/components/integrations-form";

export default async function TenantSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const storeDoc = await adminDb.collection("stores").doc(storeId).get();

  if (!storeDoc.exists) {
    redirect("/dashboard");
  }

  const store = storeDoc.data()!;
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="space-y-6 font-sans max-w-full pb-12">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your workspace identity, preferences, and integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-2">
        <div className="flex flex-col gap-6 h-full">
          <StoreProfileForm 
            storeId={storeId} 
            initialName={store.name} 
            initialLogo={store.logo_url || ""} 
            initialEmail={store.email || ""}
            initialInstagram={store.instagram || ""}
            initialWhatsapp={store.whatsapp || ""}
          />
          <StorePreferencesForm 
            storeId={storeId} 
            initialCurrency={store.currency || "IDR"} 
          />
        </div>
        <div className="flex flex-col gap-6 h-full">
          <StoreCredentialsPanel storeId={storeId} />
          <IntegrationsForm 
            storeId={storeId}
            initialMidtransServerKey={store.api_keys?.midtrans_server_key || ""}
            initialMidtransClientKey={store.api_keys?.midtrans_client_key || ""}
          />
          <DangerZonePanel storeId={storeId} />
        </div>
      </div>
    </div>
  );
}
