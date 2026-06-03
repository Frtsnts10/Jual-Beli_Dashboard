"use server";

import { xendit } from "@/lib/xendit";
import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string, _storeCount: number) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const profileDoc = await adminDb.collection("profiles").doc(user.uid).get();
  if (!profileDoc.exists) throw new Error("Profile not found");
  const profile = profileDoc.data()!;

  const invoice = await xendit.invoice.create({
    external_id: `inv_${Date.now()}`,
    amount: priceId === "price_mock_enterprise_tier" ? 290000 : 99000,
    payer_email: profile.email,
    description: "Shop Dashboard Subscription",
    success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?checkout_success=true`,
    failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`,
  });

  redirect(invoice.invoice_url!);
}

export async function createBillingPortalSession() {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`;
  redirect(portalUrl);
}