"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { createComplaintAction } from "../actions/complaint-actions";
import { Input, Select, SelectItem, Textarea, Button } from "@heroui/react";

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
      className="p-5 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 font-sans transition-colors"
    >
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Ingest Telemetry Incident Ticket
      </h3>

      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          name="customer_name"
          label="Impacted Customer"
          isRequired
          placeholder="John Smith"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        />
        <Input
          name="title"
          label="Incident Title"
          isRequired
          placeholder="Package damage vectors detected"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        />
        <Select
          name="priority"
          label="Severity Priority"
          defaultSelectedKeys={["medium"]}
          variant="faded"
          radius="lg"
          classNames={{
            trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-0",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            value: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        >
          <SelectItem key="low">Low Severity</SelectItem>
          <SelectItem key="medium">Medium Matrix</SelectItem>
          <SelectItem key="high">Critical Telemetry Outage</SelectItem>
        </Select>
      </div>

      <Textarea
        name="description"
        label="Diagnostic Log Overview"
        isRequired
        minRows={3}
        placeholder="Detailing physical stress conditions or unfulfilled client vectors..."
        variant="faded"
        radius="lg"
        classNames={{
          inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
          label: "text-[10px] font-bold text-slate-400 uppercase",
          input: "text-xs text-slate-800 dark:text-slate-100"
        }}
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          className="text-xs font-bold shadow-sm"
        >
          {isPending ? "Transmitting..." : "Append Support Event"}
        </Button>
      </div>
    </form>
  );
}
