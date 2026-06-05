import { NextResponse } from 'next/server';
import { Xendit } from 'xendit-node';
import { adminAuth, adminDb } from '@/lib/firebase/server';

const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! });
const { Invoice } = xenditClient;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const { plan, storeId } = await req.json();

    const invoice = await Invoice.createInvoice({
      data: {
        externalId: `saas-${decodedToken.uid}-${Date.now()}`,
        amount: plan === 'pro-yearly' ? 3990000 : plan === 'pro-weekly' ? 149000 : 490000,
        description: `Obsidian SaaS Subscription - ${plan}`,
        customer: {
          email: decodedToken.email,
        },
        successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/failure`,
      }
    });

    return NextResponse.json({ invoiceUrl: invoice.invoiceUrl });
  } catch (error) {
    console.error('Xendit Invoice Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
