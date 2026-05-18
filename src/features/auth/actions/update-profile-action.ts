"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const enable2fa = formData.get("enable2fa") === "true";

    const supabase = await createServerSupabase();
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) {
      return { error: "Authentication credentials state missing" };
    }

    const updates: any = {
      data: {
        full_name: fullName || undefined,
        two_factor_enabled: enable2fa,
      },
    };

    if (email && email !== userRes.user.email) {
      updates.email = email;
    }

    if (password && password.trim().length > 0) {
      updates.password = password;
    }

    // Trigger secure Supabase Auth update loop
    const { data: authUpdate, error: updateErr } = await supabase.auth.updateUser(updates);
    if (updateErr) {
      return { error: updateErr.message };
    }

    // Simultaneously mirror state vectors into public profiles table structure using Admin keys
    const adminSupabase = await createAdminSupabase();
    await adminSupabase
      .from("profiles")
      .update({
        full_name: fullName || userRes.user.user_metadata?.full_name,
        email: email || userRes.user.email,
      })
      .eq("id", userRes.user.id);

    revalidatePath("/", "layout");
    return {
      success: true,
      message: email && email !== userRes.user.email 
        ? "Profile updated successfully! A verification vector link has been dispatched to authenticate the newly updated email address." 
        : "Supabase authentication descriptors updated securely across active database bindings.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to finalize Profile update stream" };
  }
}
