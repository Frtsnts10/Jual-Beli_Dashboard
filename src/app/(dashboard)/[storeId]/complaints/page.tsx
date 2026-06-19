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
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Log Insiden Dukungan SLA</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Terima rincian telemetri kritis dan klik lencana untuk memajukan status siklus.
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
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg">
            <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Umpan Telemetri Pelanggan Otomatis</h3>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
              Insiden mengalir otomatis dari portal klien. Tindakan seperti mengirim OTP, sinkronisasi kredensial, pengembalian dana, dan perpanjangan durasi dikelola langsung di profil pelanggan individu di modul Meja Pelanggan.
            </p>
          </div>

          <ComplaintTable storeId={storeId} complaints={complaints} currency={currency} />
        </>
      )}
    </div>
  );
}
