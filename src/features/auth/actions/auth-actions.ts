"use server";

import { adminDb, adminAuth, getAuthenticatedUser } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signInAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    // Server-side sign in: We cannot call Firebase Client SDK on the server.
    // The client component will handle Firebase Auth signInWithEmailAndPassword,
    // then POST the idToken to /api/auth/session.
    // This server action is kept for compatibility but actual auth happens client-side.
    return { error: "Please use the client-side sign-in flow." };
  } catch (err: any) {
    console.error("Signin unhandled exception error:", err);
    return { 
      error: err.message === "fetch failed" || err.message?.includes("fetch")
        ? "Connection to database failed. Please verify your Firebase project is active and environment variables are configured correctly."
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

    // Create user via Firebase Admin
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Auto-provision profile document in Firestore
    await adminDb.collection("profiles").doc(userRecord.uid).set({
      id: userRecord.uid,
      email: userRecord.email,
      full_name: fullName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      is_premium: false,
      created_at: new Date().toISOString(),
    });

    return { 
      success: true, 
      message: "Account created successfully! Please sign in with your credentials." 
    };
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT" || err.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("Signup unhandled exception error:", err);
    return { error: err.message || "An unexpected error occurred during signup" };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
