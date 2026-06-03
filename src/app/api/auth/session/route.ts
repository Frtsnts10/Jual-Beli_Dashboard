import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/firebase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const { sessionCookie, expiresIn } = await createSessionCookie(idToken);

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
