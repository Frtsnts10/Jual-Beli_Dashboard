import "server-only";
import { getSessionUser } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";

// The showcase account ("Coba demo"): a seller login with the custom claim demo: true, set by
// scripts/seed-demo.mjs. Anyone can open it without a password, so it is read-only — every server
// action that changes something starts with `const demo = await demoBlocked(); if (demo) return demo;`.

export const DEMO_MESSAGE = "Mode demo: hanya bisa melihat. Daftar akun sendiri untuk mencoba mengubah data.";

/** Whether the signed-in session is the demo account. */
export async function isDemoSession(): Promise<boolean> {
  return (await getSessionUser())?.demo === true;
}

/** A failed ActionResult for the demo account, or null for everyone else. */
export async function demoBlocked(): Promise<ActionResult<never> | null> {
  return (await isDemoSession()) ? fail(DEMO_MESSAGE) : null;
}
