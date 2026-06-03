import React from "react";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { SubscriptionClientPage } from "@/features/subscription/components/subscription-client-page";
import { adminDb } from "@/lib/firebase/server";

export default async function TenantSubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ payment_success?: string }>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const isPaymentSuccess = resolvedSearchParams?.payment_success === "true";

  const [storeDoc, status] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    getSubscriptionStatus(storeId),
  ]);

  const currency = storeDoc.data()?.currency || "IDR";

  return (
    <SubscriptionClientPage
      storeId={storeId}
      isPaymentSuccess={isPaymentSuccess}
      isSubscribed={status.isSubscribed}
      plan={status.plan}
      status={status.status}
      currentPeriodEnd={status.currentPeriodEnd}
      currency={currency}
    />
  );
}
