import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Return to login if no session is found and trying to access protected routes
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // NOTE: True JWT validation using firebase-admin requires an API route or Node.js runtime. 
  // Next.js Edge runtime does not fully support firebase-admin out of the box. 
  // For this middleware, we simply check for the presence of the cookie. 
  // API routes and Server Actions will enforce strict verification.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)'],
};
