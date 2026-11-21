import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/access/auth";
import { acceptPendingInvites } from "@/lib/access/team";

const EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;
const DEMO_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken, fullName } = (await req.json()) as { idToken?: string; fullName?: string };
    if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    // Only mint a long-lived session from a fresh sign-in.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Sign-in terlalu lama, silakan login ulang." }, { status: 401 });
    }

    const userRef = adminDb.collection("users").doc(decoded.uid);
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        tx.set(userRef, {
          email: decoded.email ?? "",
          full_name: fullName?.trim() || decoded.name || "",
          subscription_tier: "starter",
          subscription_expiry: null,
          created_at: FieldValue.serverTimestamp(),
        });
      }
    });

    // Invitations only count for a verified address (password sign-ups verify by email link;
    // Google accounts are verified), so nobody can claim an invite by typing someone's email.
    // Never for the shared demo login: an invite to it would show that store to every visitor.
    const demo = decoded.demo === true;
    if (decoded.email_verified && !demo) await acceptPendingInvites(decoded.uid, decoded.email);

    // The demo session is short-lived; it is shared and read-only anyway.
    const expiresIn = demo ? DEMO_EXPIRES_IN_MS : EXPIRES_IN_MS;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Gagal membuat sesi login." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
