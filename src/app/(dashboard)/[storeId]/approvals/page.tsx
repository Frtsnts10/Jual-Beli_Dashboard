import React from "react";
import { Metadata } from "next";
import { getPendingDraftsAction } from "@/features/approvals/actions/approvals-actions";
import { ApprovalsTable } from "@/features/approvals/components/approvals-table";

export const metadata: Metadata = {
  title: "Approvals Desk",
};

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const pendingDrafts = await getPendingDraftsAction(storeId);

  return (
    <div className="space-y-6 max-w-full pb-12 font-sans">
      <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Meja Persetujuan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Tinjau dan gabungkan usulan perubahan dari anggota staf sebelum ditayangkan.
        </p>
      </div>

      <div className="animate-in fade-in duration-300 delay-100">
        <ApprovalsTable storeId={storeId} drafts={pendingDrafts} />
      </div>
    </div>
  );
}
