import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

/** The showcase seller (scripts/seed-demo.mjs). Only a login carrying the demo claim is handed out. */
const DEMO_EMAIL = process.env.DEMO_SELLER_EMAIL || "demo@belidi.biz.id";

/**
 * "Coba demo": a custom token for the read-only demo seller. The browser signs in with it and
 * exchanges the ID token for a session cookie (/api/auth/session) like any other login.
 */
export async function POST() {
  const user = await adminAuth.getUserByEmail(DEMO_EMAIL).catch(() => null);
  if (!user || user.customClaims?.demo !== true) return NextResponse.json({ error: "Akun demo belum disiapkan." }, { status: 404 });
  return NextResponse.json({ token: await adminAuth.createCustomToken(user.uid) });
}
