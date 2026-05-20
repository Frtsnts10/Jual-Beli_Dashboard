import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/verify-email";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      redirectTo.searchParams.set("success", "true");
      return NextResponse.redirect(redirectTo);
    } else {
      redirectTo.searchParams.set("error", error.message);
      return NextResponse.redirect(redirectTo);
    }
  }

  // If the parameters are missing
  redirectTo.searchParams.set("error", "Invalid confirmation link.");
  return NextResponse.redirect(redirectTo);
}
