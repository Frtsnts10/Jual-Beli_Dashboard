import React from "react";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { SubscriptionStatus } from "@/features/subscription/components/subscription-status";
import { PricingCard } from "@/features/subscription/components/pricing-card";
import { CheckCircle2, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";

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

  const supabase = await createServerSupabase();
  const [storeRes, status] = await Promise.all([
    supabase.from("stores").select("currency").eq("id", storeId).single(),
    getSubscriptionStatus(storeId),
  ]);

  const currency = storeRes.data?.currency || "IDR";

  return (
    <div className="space-y-8 font-sans pb-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Billing & Quota Management</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review current database quota bounds and trigger premium tier telemetry paths.
        </p>
      </div>

      {isPaymentSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-start sm:items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-bounce-once">
          <div className="p-2 bg-emerald-500 text-white rounded-sm shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Payment Transaction Authorized Successfully!
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              Simulated handshakes have activated standard PCI-DSS boundaries. Plan status updated to <strong className="text-emerald-900 dark:text-emerald-200">Shop Dashboard Pro</strong> across persistent clusters.
            </p>
          </div>
        </div>
      )}

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
        <PricingCard storeId={storeId} isSubscribed={status.isSubscribed} currency={currency} />
      </div>
    </div>
  );
}
