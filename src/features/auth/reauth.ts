"use client";

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";

/**
 * Proves it's really the account owner at the keyboard before a destructive action: a fresh sign-in
 * (password, or a Google popup for Google-only accounts) whose ID token the server then verifies.
 * Shows a toast and returns null when it fails.
 */
export async function reauthenticate(method: "password" | "google", email: string, password: string): Promise<string | null> {
  try {
    const cred =
      method === "password"
        ? await signInWithEmailAndPassword(auth, email, password)
        : await signInWithPopup(auth, new GoogleAuthProvider().setCustomParameters({ login_hint: email, prompt: "select_account" }));
    return await cred.user.getIdToken(true);
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    toast.error(
      /invalid-credential|wrong-password|user-mismatch/.test(code)
        ? "Password salah."
        : /popup-closed|cancelled-popup/.test(code)
          ? "Verifikasi Google dibatalkan."
          : /too-many-requests/.test(code)
            ? "Terlalu banyak percobaan. Coba lagi beberapa menit lagi."
            : "Verifikasi gagal. Coba lagi.",
    );
    return null;
  }
}
