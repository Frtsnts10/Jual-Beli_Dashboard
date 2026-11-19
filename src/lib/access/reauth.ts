import "server-only";
import { adminAuth } from "@/lib/firebase/admin";

/** How the user proves it's them before a destructive action: their password if they have one, else Google. */
export async function verifyMethod(uid: string): Promise<"password" | "google"> {
  const u = await adminAuth.getUser(uid).catch(() => null);
  return u?.providerData.some((p) => p.providerId === "password") || !u?.providerData.some((p) => p.providerId === "google.com") ? "password" : "google";
}

/** Whether `idToken` comes from `uid` signing in again within the last five minutes. */
export async function freshlyVerified(idToken: string, uid: string): Promise<"ok" | "invalid" | "stale"> {
  const proof = await adminAuth.verifyIdToken(idToken, true).catch(() => null);
  if (!proof || proof.uid !== uid) return "invalid";
  return Date.now() / 1000 - proof.auth_time > 5 * 60 ? "stale" : "ok";
}
