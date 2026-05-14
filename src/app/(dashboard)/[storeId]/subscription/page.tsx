import React from "react";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { SubscriptionStatus } from "@/features/subscription/components/subscription-status";
import { PricingCard } from "@/features/subscription/components/pricing-card";

export default async function TenantSubscriptionPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const status = await getSubscriptionStatus(storeId);

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Billing & Quota Management</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review current database quota bounds and trigger premium tier telemetry paths.
        </p>
      </div>

      <SubscriptionStatus
        isSubscribed={status.isSubscribed}
        plan={status.plan}
        status={status.status}
        currentPeriodEnd={status.currentPeriodEnd}
      />

      <div className="pt-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Provision Resource Scales</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upgrade your active shard to bypass API limits instantly</p>
        </div>
        <PricingCard storeId={storeId} isSubscribed={status.isSubscribed} />
      </div>
    </div>
  );
}
