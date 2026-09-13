import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Return to sign-in if no session is found and trying to access protected routes
  if (!session && !request.nextUrl.pathname.startsWith('/sign-in') && !request.nextUrl.pathname.startsWith('/sign-up') && !request.nextUrl.pathname.startsWith('/verify') && !request.nextUrl.pathname.startsWith('/forgot-password')) {
    // Only redirect if it's the dashboard route or root route (if not marketing)
    // Actually, root is marketing. So we shouldn't redirect from root unless we want to.
    // The previous matcher excluded login and signup, let's fix it.
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|verify-mfa|verify-email|forgot-password|$).*)'],
};
