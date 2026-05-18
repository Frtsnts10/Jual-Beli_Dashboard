"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if MFA is required (Assurance Level check)
  if (data.user && data.session) {
    const { data: aal, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    // If nextLevel is aal2, it means the user HAS a verified factor but is currently at aal1
    if (!aalErr && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return { requiresMfa: true };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string) || "Store Owner";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Instantly auto-provision target profile row inside Supabase profiles table mapping unique ID vectors securely via Admin pipeline
  if (data.user) {
    const adminSupabase = await createAdminSupabase();
    await adminSupabase.from("profiles").upsert({
      id: data.user.id,
      clerk_id: data.user.id, // Keep backward structural compatibility column values populated
      email: data.user.email,
      full_name: fullName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
