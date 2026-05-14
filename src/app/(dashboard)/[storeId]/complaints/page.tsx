import React from "react";
import { getComplaintsAction } from "@/features/complaints/actions/complaint-actions";
import { ComplaintForm } from "@/features/complaints/components/complaint-form";
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

      <ComplaintForm storeId={storeId} />

      <ComplaintTable storeId={storeId} complaints={complaints} currency={currency} />
    </div>
  );
}
