import React from "react";
import { redirect } from "next/navigation";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { StoreSwitcher } from "@/features/stores/components/store-switcher";
import { UserButton } from "@/features/auth/components/user-button";

export default async function DashboardRootPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Ensure database sync is confirmed for foreign-key validation mapping
  const profileId = user.id;
  const adminSupabase = await createAdminSupabase();

  // Ensure current profile row exists natively to satisfy Foreign Key dependencies on child table inserts
  await adminSupabase.from("profiles").upsert({
    id: user.id,
    clerk_id: user.id,
    email: user.email || "owner@premium-console.dev",
    full_name: user.user_metadata?.full_name || "Verified Store Owner",
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || user.id)}`,
  });

  const { data: stores } = await adminSupabase
    .from("stores")
    .select("id")
    .eq("owner_id", profileId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (stores && stores.length > 0) {
    redirect(`/${stores[0].id}/dashboard`);
  }

  // If zero stores exist, present explicit provision workflow layout
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
        <span className="font-bold text-slate-800">Shop Dashboard Suite</span>
        <UserButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            🏪
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome to Shop Dashboard Console</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            You don&apos;t have any mapped storefront instances yet. Create your first workspace partition below to unlock live inventory tables and customer CRM vectors.
          </p>
          <div className="flex justify-center">
            <StoreSwitcher stores={[]} profileId={profileId} />
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            Click the dropdown button above to prompt the Add Workspace window.
          </p>
        </div>
      </main>
    </div>
  );
}
