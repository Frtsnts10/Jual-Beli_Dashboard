import React from "react";
import { getComplaintsAction } from "@/features/complaints/actions/complaint-actions";
import { ComplaintTable } from "@/features/complaints/components/complaint-table";

import { createServerSupabase } from "@/lib/supabase/server";

export default async function TenantComplaintsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();
  const [storeRes, complaints] = await Promise.all([
    supabase.from("stores").select("currency").eq("id", storeId).single(),
    getComplaintsAction(storeId),
  ]);

  const currency = storeRes.data?.currency || "USD";

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">SLA Support Incident Logs</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Ingest critical telemetry breakdowns and click badge tokens to advance cycle status.
        </p>
      </div>

      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-sm">
        <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Automated Customer Telemetry Feed</h3>
        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
          Incidents flow automatically from client-facing portals. Actions such as sending OTPs, credential resynced, refunds, and duration extensions are natively managed on individual customer profiles inside the Customer desk module.
        </p>
      </div>

      <ComplaintTable storeId={storeId} complaints={complaints} currency={currency} />
    </div>
  );
}
