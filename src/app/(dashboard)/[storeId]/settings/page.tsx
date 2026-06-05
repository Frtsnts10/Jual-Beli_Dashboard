import React from "react";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { redirect } from "next/navigation";
import { StoreSettingsForm, DangerZonePanel, AppearanceSettingsPanel } from "@/features/settings/components/store-settings-form";
import { EditProfileForm } from "@/features/auth/components/edit-profile-form";
import { SettingsHeader } from "@/features/settings/components/settings-header";

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

  const initialName = user?.name || "Workspace Admin";
  const initialEmail = user?.email || "";

  return (
    <div className="space-y-6 font-sans max-w-full pb-12">
      <SettingsHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-300">
        {/* Left Column: Principal Authentication, Profile Desk, Appearance, and Danger Zone */}
        <div className="flex flex-col gap-6 h-full">
          <EditProfileForm
            initialName={initialName}
            initialEmail={initialEmail}
          />
          <AppearanceSettingsPanel />
          <DangerZonePanel storeId={storeId} />
        </div>

        {/* Right Column: Tenant Domain Configurations */}
        <div className="flex flex-col gap-6 h-full">
          <div className="flex-1">
            <StoreSettingsForm 
              storeId={storeId} 
              initialName={store.name} 
              initialLogo={store.logo_url || ""} 
              initialCurrency={store.currency || "IDR"} 
              initialEmail={store.email || ""}
              initialInstagram={store.instagram || ""}
              initialWhatsapp={store.whatsapp || ""}
              hideDangerPanel
            />
          </div>
        </div>
      </div>
    </div>
  );
}
