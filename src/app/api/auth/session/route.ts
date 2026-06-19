import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, adminDb } from '@/lib/firebase/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const pk = process.env.FIREBASE_PRIVATE_KEY || '';
  return NextResponse.json({
    diagnostics: true,
    hasKey: !!pk,
    length: pk.length,
    includesBegin: pk.includes('BEGIN PRIVATE KEY'),
    includesEnd: pk.includes('END PRIVATE KEY'),
    hasNewlines: pk.includes('\\n') || pk.includes('\n'),
    projectId: process.env.FIREBASE_PROJECT_ID,
    email: process.env.FIREBASE_CLIENT_EMAIL,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const { sessionCookie, expiresIn } = await createSessionCookie(idToken);
    
    // Strict Device Fingerprinting Logic
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP';
    const currentFingerprint = `${userAgent} | ${ip}`;

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // First time session creation: Lock device fingerprint
      await userRef.set({ 
        registered_device_fingerprint: currentFingerprint,
        registered_ip: ip,
        registered_user_agent: userAgent,
        created_at: new Date().toISOString()
      }, { merge: true });
    } else {
      const data = userDoc.data();
      const lockedFingerprint = data?.registered_device_fingerprint;
      
      // If they have a locked fingerprint and it doesn't match, block the session!
      if (lockedFingerprint && lockedFingerprint !== currentFingerprint) {
        console.warn(`Device mismatch blocked for user ${uid}. Locked: ${lockedFingerprint}, Attempted: ${currentFingerprint}`);
        return NextResponse.json(
          { error: 'Device Mismatch: This account is locked to its original device. Please contact support.' }, 
          { status: 403 }
        );
      }
      
      // If it exists but no fingerprint yet, lock it now
      if (!lockedFingerprint) {
        await userRef.update({ 
          registered_device_fingerprint: currentFingerprint,
          registered_ip: ip,
          registered_user_agent: userAgent,
        });
      }
    }

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
    return NextResponse.json({ 
      error: error.message || 'Failed to create session',
      stack: error.stack
    }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
