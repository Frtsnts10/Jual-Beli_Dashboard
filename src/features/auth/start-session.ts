import type { UserCredential } from "firebase/auth";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email atau password salah.",
  "auth/email-already-in-use": "Email sudah terdaftar. Silakan masuk.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
  "auth/popup-closed-by-user": "Login Google dibatalkan.",
};

export function authErrorMessage(err: unknown) {
  const code = (err as { code?: string })?.code;
  if (code && ERRORS[code]) return ERRORS[code];
  return err instanceof Error ? err.message : "Terjadi kesalahan.";
}

/** Exchanges the Firebase ID token for an httpOnly session cookie, then enters the app. */
export async function startSession(cred: UserCredential, fullName?: string, next = "/dashboard") {
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, fullName }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Gagal membuat sesi login.");
  }
  // Only allow same-origin relative paths as the post-login destination.
  window.location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
