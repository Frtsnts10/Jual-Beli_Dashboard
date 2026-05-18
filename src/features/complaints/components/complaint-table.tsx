"use client";

import React, { useState, useTransition } from "react";
import { Complaint, deleteComplaintAction, applyComplaintSatisfactionAction } from "../actions/complaint-actions";
import { Trash2, Loader2, AlertTriangle, CheckCircle, RefreshCw, Gift, ShieldAlert, User } from "lucide-react";
import { ComplaintStatusBadge } from "./complaint-status-badge";
import { toast } from "sonner";

interface ComplaintTableProps {
  storeId: string;
  complaints: Complaint[];
  currency?: string;
}

export function ComplaintTable({ storeId, complaints, currency = "IDR" }: ComplaintTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [satisfactionId, setSatisfactionId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteComplaintAction(storeId, id);
    setDeletingId(null);
    toast.success("Incident record purged from SLA logs successfully");
  };

  const handleSatisfaction = async (id: string, outcome: string) => {
    setSatisfactionId(id);
    await applyComplaintSatisfactionAction(storeId, id, outcome);
    setSatisfactionId(null);
    toast.success(`Customer satisfaction guaranteed: ${outcome}`);
  };

  // Grouping complaints by User to match user requests perfectly
  const groupedComplaints = complaints.reduce((acc, current) => {
    const key = current.customer_name || "Anonymous identity";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(current);
    return acc;
  }, {} as Record<string, Complaint[]>);

  const priorityStyles: Record<Complaint["priority"], string> = {
    low: "bg-slate-50 dark:bg-[#0b0f19] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    medium: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800/80 shadow-2xs font-extrabold transition-colors",
  };

  return (
    <div className="space-y-6 font-sans transition-colors">
      {Object.keys(groupedComplaints).length > 0 ? (
        Object.entries(groupedComplaints).map(([userName, userComplaints]) => (
          <div
            key={userName}
            className="bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            {/* User Grouping Header Container */}
            <div className="bg-gradient-to-r from-slate-50 dark:from-[#0b0f19] to-slate-100/60 dark:to-[#0d1322]/60 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-100 dark:border-indigo-900/50 shrink-0 shadow-inner">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    Grouped Telemetry Vector
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{userName}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-2xs transition-colors">
                  Active SLA Logs:{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{userComplaints.length}</span>
                </span>
              </div>
            </div>

            {/* User Complaints Matrix List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {userComplaints.map((c) => {
                const isDeleting = deletingId === c.id;
                const isSatisfying = satisfactionId === c.id;

                return (
                  <div key={c.id} className="p-5 sm:p-6 flex flex-col lg:flex-row gap-5 items-start justify-between hover:bg-slate-50/20 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Left Column: Core context description */}
                    <div className="space-y-2.5 max-w-2xl flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${priorityStyles[c.priority]}`}>
                          {c.priority} Priority
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">{c.title}</h5>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/50 dark:bg-[#0b0f19]/50 p-3 rounded-sm border border-slate-100/80 dark:border-slate-800/80 transition-colors">
                        {c.description}
                      </p>

                      {/* Display outcome flag beautifully if satisfied */}
                      {c.satisfaction_outcome ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-sm text-[11px] font-bold text-emerald-800 dark:text-emerald-400 animate-in fade-in transition-colors">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Satisfaction Mitigated: {c.satisfaction_outcome}</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Apply Satisfaction Goodwill:</span>
                          
                          {/* Satisfaction Trigger Tokens */}
                          <button
                            type="button"
                            onClick={() => handleSatisfaction(c.id, `Refund Granted (${currency})`)}
                            disabled={isSatisfying}
                            className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-sm text-[10px] font-black transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Issue Refund
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSatisfaction(c.id, "Extended Access (+7 Days)")}
                            disabled={isSatisfying}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          >
                            <Gift className="w-2.5 h-2.5" /> Free Plus 7 Days
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSatisfaction(c.id, "Priority Account Support Shard Assigned")}
                            disabled={isSatisfying}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 rounded-sm text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          >
                            <ShieldAlert className="w-2.5 h-2.5" /> Route Premium Pool
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Dynamic Matrix Badges & Controls */}
                    <div className="flex items-center lg:flex-col justify-between w-full lg:w-auto gap-4 lg:items-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800 shrink-0 transition-colors">
                      <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          State Matrix
                        </span>
                        <ComplaintStatusBadge storeId={storeId} complaint={c} />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                          ID: {c.id.split("-")[0]}
                        </span>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm transition-colors disabled:opacity-50"
                          title="Erase Incident Matrix"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="p-12 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 text-center space-y-2 shadow-2xs transition-colors">
          <p className="text-xs font-bold text-slate-400 italic uppercase tracking-wider">
            SLA Streams Highly Operational
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zero support breakdown incidents or streaming credentials logged. Use the master payload form to provision logs manually.
          </p>
        </div>
      )}
    </div>
  );
}
