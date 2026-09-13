import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complaints",
};


import { getComplaintsAction } from "@/features/complaints/actions/complaint-actions";
import { ComplaintTable } from "@/features/complaints/components/complaint-table";
import { adminDb } from "@/lib/firebase/server";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { PremiumLockOverlay } from "@/features/subscription/components/premium-lock-overlay";

export default async function TenantComplaintsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [storeDoc, complaints, subscription] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    getComplaintsAction(storeId),
    getSubscriptionStatus(),
  ]);

  const currency = storeDoc.data()?.currency || "IDR";

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-slate-100 tracking-tight">SLA Support Incident Logs</h2>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
          Receive critical telemetry details and click the badge to advance the cycle status.
        </p>
      </div>

      {!subscription.isSubscribed ? (
        <PremiumLockOverlay 
          storeId={storeId}
          featureName="SLA Dispute Desk"
          description="Automated incident hooks are locked under the Standard plan. Upgrade to Shop Dashboard Pro to ingest real-time disputes automatically from user storefronts, configure webhook listeners, and trigger one-click SLA refunds."
        />
      ) : (
        <>
          <div className="p-4 bg-blue-50/50 dark:bg-indigo-950/20 border border-blue-100 dark:border-indigo-900/40 rounded-lg">
            <h3 className="text-xs font-bold text-blue-900 dark:text-indigo-300">Automated Customer Telemetry Feed</h3>
            <p className="text-[11px] text-blue-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
              Incidents flow automatically from the client portal. Actions like sending OTPs, credential syncing, refunds, and duration extensions are managed directly in individual customer profiles within the Customer Desk module.
            </p>
          </div>

          <ComplaintTable storeId={storeId} complaints={complaints} currency={currency} />
        </>
      )}
    </div>
  );
}
