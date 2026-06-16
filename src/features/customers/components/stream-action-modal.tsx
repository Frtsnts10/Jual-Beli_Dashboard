"use client";

import React, { useState } from "react";
import { extendCustomerProductAction, banCustomerProductAction } from "../actions/customer-actions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { toast } from "sonner";

export function StreamActionModal({
  storeId,
  target,
  onClose,
}: {
  storeId: string;
  target: {
    customerId: string;
    productIndex: number;
    productName: string;
    mode: "extend" | "ban";
  };
  onClose: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("Violation of streaming parameters or account sharing breach");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);

    if (target.mode === "extend") {
      const added = parseInt(days, 10);
      if (isNaN(added) || added <= 0) {
        toast.error("Please provide a valid integer duration");
        setIsPending(false);
        return;
      }
      const res = await extendCustomerProductAction(storeId, target.customerId, target.productIndex, added);
      setIsPending(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Stream segment extended by +${added} days successfully`);
        onClose();
      }
    } else {
      const res = await banCustomerProductAction(storeId, target.customerId, target.productIndex, reason);
      setIsPending(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Stream segment successfully terminated and flagged as Banned");
        onClose();
      }
    }
  }

  return (
    <Modal isOpen={true} onOpenChange={(open) => !open && onClose()} size="sm" classNames={{
      base: "bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl",
      header: target.mode === "extend" ? "bg-indigo-50 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/40" : "bg-red-50 dark:bg-red-950/50 border-b border-red-100 dark:border-red-900/40",
      body: "p-5 space-y-4",
      footer: "pt-2 border-t border-slate-100 dark:border-slate-800"
    }}>
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <ModalHeader className="flex flex-col gap-1">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${
                target.mode === "extend" ? "text-indigo-800 dark:text-indigo-300" : "text-red-800 dark:text-red-300"
              }`}>
                {target.mode === "extend" ? "Extend Coverage Lifecycle" : "Ban / Terminate Asset Stream"}
              </h3>
            </ModalHeader>

            <ModalBody>
              <Input
                label="Target Stream Asset"
                isReadOnly
                value={target.productName}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 h-[34px]",
                  label: "text-[10px] font-bold text-slate-400 uppercase",
                  input: "text-xs font-bold text-slate-700 dark:text-slate-300"
                }}
              />

              {target.mode === "extend" ? (
                <div>
                  <Input
                    type="number"
                    label="Additional Duration (Days)"
                    isRequired
                    autoFocus
                    min={1}
                    value={days}
                    onValueChange={setDays}
                    variant="faded"
                    radius="lg"
                    classNames={{
                      inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
                      label: "text-[10px] font-bold text-slate-400 uppercase",
                      input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                    }}
                  />
                  <div className="flex gap-1.5 mt-2">
                    {["7", "14", "30", "90"].map((d) => (
                      <Button key={d} onPress={() => setDays(d)} variant="flat" size="sm" className="h-[20px] min-w-0 px-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                        +{d}d
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Termination / Ban Reason</label>
                  <textarea required autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Terms of Service breach" className="w-full p-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} radius="lg" className="text-xs font-bold text-slate-600 dark:text-slate-400 h-[28px] min-h-0">
                Cancel
              </Button>
              <Button type="submit" isLoading={isPending} color={target.mode === "extend" ? "primary" : "danger"} radius="lg" className="text-xs font-bold shadow-sm h-[28px] min-h-0">
                {isPending ? "Broadcasting..." : target.mode === "extend" ? "Confirm Extension" : "Enforce Ban"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
