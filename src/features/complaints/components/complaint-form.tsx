"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { createComplaintAction } from "../actions/complaint-actions";

interface ComplaintFormProps {
  storeId: string;
}

export function ComplaintForm({ storeId }: ComplaintFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createComplaintAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      form.reset();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 font-sans transition-colors"
    >
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Ingest Telemetry Incident Ticket
      </h3>

      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Impacted Customer</label>
          <input
            name="customer_name"
            type="text"
            required
            placeholder="John Smith"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Incident Title</label>
          <input
            name="title"
            type="text"
            required
            placeholder="Package damage vectors detected"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Severity Priority</label>
          <select
            name="priority"
            defaultValue="medium"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            <option value="low">Low Severity</option>
            <option value="medium">Medium Matrix</option>
            <option value="high">Critical Telemetry Outage</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnostic Log Overview</label>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="Detailing physical stress conditions or unfulfilled client vectors..."
          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all"
        >
          {isPending ? "Transmitting..." : "Append Support Event"}
        </button>
      </div>
    </form>
  );
}
