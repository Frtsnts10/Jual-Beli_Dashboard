import React from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoreSettingsForm, DangerZonePanel } from "@/features/settings/components/store-settings-form";
import { EditProfileForm } from "@/features/auth/components/edit-profile-form";

export default async function TenantSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();
  const { data: store } = await supabase
    .from("stores")
    .select("name, logo_url, currency, email, instagram, whatsapp")
    .eq("id", storeId)
    .single();

  if (!store) {
    redirect("/dashboard");
  }

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  // Retrieve live enrolled MFA factors list from Supabase Auth Server
  const { data: factors } = await supabase.auth.mfa.listFactors();

  const initialName = user?.user_metadata?.full_name || "Workspace Admin";
  const initialEmail = user?.email || "";
  const initialAvatar = user?.user_metadata?.avatar_url || "";
  const initial2fa = factors?.totp?.some((f: any) => f.status === "verified") === true;
  const initialRestData = JSON.stringify(user?.user_metadata?.rest_data || {});

  return (
    <div className="space-y-6 font-sans max-w-full pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Workspace Identity Bindings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure domain signatures, brand logos, and global currency parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-300">
        {/* Left Column: Principal Authentication & Profile Desk */}
        <div className="h-full">
          <EditProfileForm
            initialName={initialName}
            initialEmail={initialEmail}
            initial2fa={initial2fa}
          />
        </div>

        {/* Right Column: Tenant Domain Configurations & Danger Area Stacked */}
        <div className="flex flex-col justify-between gap-6 h-full">
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

          <div className="shrink-0">
            <DangerZonePanel storeId={storeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
