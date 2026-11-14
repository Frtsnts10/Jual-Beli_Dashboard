import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/forgot-password"];

// Cheap optimistic gate: bounce visitors without a session cookie to sign-in.
// The cookie is verified for real in lib/access/auth.ts on every page and action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");
  const isPublic = pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
