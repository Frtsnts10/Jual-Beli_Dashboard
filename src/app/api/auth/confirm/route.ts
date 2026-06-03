import { NextResponse } from "next/server";

// This route is no longer needed with Firebase Auth.
// Firebase Auth uses email verification built-in, not OTP token hash confirmation.
// Keeping as a stub redirect for backwards compatibility.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/sign-in";

  const redirectUrl = new URL(next, request.url);
  redirectUrl.searchParams.set("info", "Firebase Auth handles email verification natively.");

  return NextResponse.redirect(redirectUrl);
}
