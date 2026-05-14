import React from "react";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const adminSupabase = await createAdminSupabase();
      await adminSupabase
        .from("profiles")
        .upsert({
          id: user.id,
          clerk_id: user.id,
          email: user.email || "owner@premium-console.dev",
          full_name: user.user_metadata?.full_name || "Verified Store Owner",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || user.id)}`,
        });
    }
  } catch {
    // Graceful startup flow
  }

  return <>{children}</>;
}