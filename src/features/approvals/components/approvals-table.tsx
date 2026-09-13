"use client";

import React, { useState } from "react";
import { DraftRequest } from "../types";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip } from "@heroui/react";
import { Check, X, Eye, FileDiff } from "lucide-react";
import { approveDraftAction, rejectDraftAction } from "../actions/approvals-actions";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface ApprovalsTableProps {
  storeId: string;
  drafts: DraftRequest[];
}

export function ApprovalsTable({ storeId, drafts }: ApprovalsTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingDraft, setViewingDraft] = useState<DraftRequest | null>(null);
  
  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!approveConfirmId) return;
    setProcessingId(approveConfirmId);
    const res = await approveDraftAction(storeId, approveConfirmId);
    setProcessingId(null);
    setApproveConfirmId(null);
    setViewingDraft(null);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Pull Request Merged! Changes are now live.");
    }
  };

  const handleReject = async () => {
    if (!rejectConfirmId) return;
    setProcessingId(rejectConfirmId);
    const res = await rejectDraftAction(storeId, rejectConfirmId, "Rejected by Admin");
    setProcessingId(null);
    setRejectConfirmId(null);
    setViewingDraft(null);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Draft request rejected and discarded.");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CREATE": return "success";
      case "UPDATE": return "warning";
      case "DELETE": return "danger";
      default: return "default";
    }
  };

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 rounded-xl">
        <div className="w-16 h-16 bg-stone-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-sm font-bold text-stone-800 dark:text-slate-200">Semua sudah selesai!</h3>
        <p className="text-xs text-stone-500 mt-1">Tidak ada permintaan yang tertunda dari staf.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <Table 
          aria-label="Pending Approvals Table"
          classNames={{
            wrapper: "p-0 bg-transparent shadow-none border-none",
            th: "bg-stone-50 dark:bg-[#0d1322] text-stone-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider py-4",
            td: "py-4 text-sm border-b border-stone-100 dark:border-slate-800/60"
          }}
        >
          <TableHeader>
            <TableColumn>Proposed By</TableColumn>
            <TableColumn>Module</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Summary</TableColumn>
            <TableColumn>Date</TableColumn>
            <TableColumn align="center">Actions</TableColumn>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-stone-800 dark:text-slate-200">{draft.proposed_by.name}</span>
                    <span className="text-[10px] text-stone-500">{draft.proposed_by.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs uppercase text-blue-600 dark:text-indigo-400 font-bold bg-blue-50 dark:bg-indigo-950/50 px-2 py-1 rounded">
                    {draft.target_collection}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getTypeColor(draft.type) as any} variant="flat" className="font-bold text-[10px] uppercase">
                    {draft.type}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-stone-700 dark:text-slate-300">
                    {draft.payload.name || `Item ID: ${draft.target_id || 'New'}`}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-stone-500">
                    {new Date(draft.created_at).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={() => setViewingDraft(draft)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => setApproveConfirmId(draft.id)}
                      isLoading={processingId === draft.id}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => setRejectConfirmId(draft.id)}
                      isLoading={processingId === draft.id}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={!!approveConfirmId}
        onClose={() => setApproveConfirmId(null)}
        onConfirm={handleApprove}
        title="Merge Pull Request"
        description="Are you sure you want to approve this draft? The changes will be pushed live to the workspace immediately."
        confirmText="Approve & Merge"
      />

      <ConfirmModal
        isOpen={!!rejectConfirmId}
        onClose={() => setRejectConfirmId(null)}
        onConfirm={handleReject}
        title="Reject Pull Request"
        description="Are you sure you want to reject this draft? It will be permanently discarded."
        confirmText="Reject Draft"
        danger
      />

      {/* Basic Diff Viewer Modal */}
      {viewingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-slate-800">
              <h3 className="font-black text-stone-800 dark:text-slate-100 flex items-center gap-2">
                <FileDiff className="w-5 h-5 text-blue-500" />
                Pull Request Details
              </h3>
              <button onClick={() => setViewingDraft(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2">Proposed Payload Data</p>
                <div className="bg-stone-50 dark:bg-[#050811] border border-stone-100 dark:border-slate-800 p-4 rounded-lg font-mono text-[11px] text-stone-700 dark:text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(viewingDraft.payload, null, 2)}</pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-stone-100 dark:border-slate-800 flex justify-end gap-3 bg-stone-50 dark:bg-[#0d1322]">
              <Button variant="light" onPress={() => setViewingDraft(null)} className="font-bold text-xs">
                Close
              </Button>
              <Button color="danger" variant="flat" onPress={() => { setRejectConfirmId(viewingDraft.id); setViewingDraft(null); }} className="font-bold text-xs">
                Reject
              </Button>
              <Button color="success" onPress={() => { setApproveConfirmId(viewingDraft.id); setViewingDraft(null); }} className="font-bold text-xs text-white shadow-md shadow-emerald-500/20">
                Approve & Merge
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
