"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInAction(prevState: any, formData: FormData) {
  try {
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
  } catch (err: any) {
    console.error("Signin unhandled exception error:", err);
    return { 
      error: err.message === "fetch failed" || err.message?.includes("fetch")
        ? "Connection to database failed. Please verify that your Supabase project is active (not paused) and that your environment variables are configured correctly."
        : err.message || "An unexpected error occurred during signin"
    };
  }
}

export async function signUpAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = (formData.get("fullName") as string) || "Store Owner";

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const { headers } = await import("next/headers");
    const headersList = await headers();
    
    // Attempt to derive the correct base URL from standard Next.js and Vercel environments
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const derivedOrigin = host ? `${protocol}://${host}` : null;
    
    const origin = headersList.get("origin") || 
      derivedOrigin || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
      process.env.NEXT_PUBLIC_APP_URL || 
      "http://localhost:3000";

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/confirm`,
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
      const { error: upsertError } = await adminSupabase.from("profiles").upsert({
        id: data.user.id,
        clerk_id: data.user.id, // Keep backward structural compatibility column values populated
        email: data.user.email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      });

      if (upsertError) {
        console.error("Profiles database sync failed:", upsertError);
        return { error: `Database sync failed: ${upsertError.message}` };
      }
    }

    // If email confirmation is enabled, session will be null and user must confirm email
    if (data.user && !data.session) {
      return { 
        success: true, 
        message: "Verification email sent! Please check your inbox and verify your email before logging in." 
      };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (err: any) {
    // Next.js redirect utilizes a thrown error, so let it bubble up
    if (err.message === "NEXT_REDIRECT" || err.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Signup unhandled exception error:", err);
    return { error: err.message || "An unexpected error occurred during signup" };
  }
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
