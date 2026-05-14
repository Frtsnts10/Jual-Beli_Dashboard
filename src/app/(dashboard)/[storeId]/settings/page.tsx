import React from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoreSettingsForm } from "@/features/settings/components/store-settings-form";

export default async function TenantSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();
  const { data: store } = await supabase
    .from("stores")
    .select("name, logo_url, currency")
    .eq("id", storeId)
    .single();

  if (!store) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 font-sans max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Identity Bindings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure domain signatures, brand logos, and global currency parameters.
        </p>
      </div>

      <StoreSettingsForm 
        storeId={storeId} 
        initialName={store.name} 
        initialLogo={store.logo_url || ""} 
        initialCurrency={store.currency || "USD"} 
      />
    </div>
  );
}
