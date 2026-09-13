"use client";

import React, { useState } from "react";
import { Complaint, updateComplaintStatusAction } from "../actions/complaint-actions";
import { Loader2 } from "lucide-react";

interface ComplaintStatusBadgeProps {
  storeId: string;
  complaint: Complaint;
}

export function ComplaintStatusBadge({ storeId, complaint }: ComplaintStatusBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const cycleStatus = async () => {
    setIsUpdating(true);
    const order: Complaint["status"][] = ["pending", "investigating", "resolved"];
    const currentIndex = order.indexOf(complaint.status);
    const nextStatus = order[(currentIndex + 1) % order.length];

    await updateComplaintStatusAction(storeId, complaint.id, nextStatus);
    setIsUpdating(false);
  };

  const badgeStyles: Record<Complaint["status"], string> = {
    pending: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
    investigating: "bg-blue-50 dark:bg-indigo-950/20 text-blue-700 dark:text-indigo-400 border-blue-200 dark:border-indigo-900/40",
    resolved: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  };

  return (
    <button
      onClick={cycleStatus}
      disabled={isUpdating}
      title="Click to cycle status matrix state"
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${badgeStyles[complaint.status]}`}
    >
      {isUpdating && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className="uppercase tracking-wider">{complaint.status}</span>
    </button>
  );
}
