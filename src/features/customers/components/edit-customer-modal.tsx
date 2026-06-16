"use client";

import React, { useState } from "react";
import { Customer, updateCustomerAction } from "../actions/customer-actions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";

export function EditCustomerModal({
  storeId,
  customer,
  onClose,
}: {
  storeId: string;
  customer: Customer;
  onClose: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstName, setFirstName] = useState(customer.first_name || customer.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(customer.last_name || customer.name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState(customer.phone || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setIsPending(true);
    const res = await updateCustomerAction(storeId, customer.id, { 
      first_name: firstName, 
      last_name: lastName, 
      email: customer.email, // Keep existing email in DB
      phone 
    });
    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Customer profile updated securely");
      onClose();
    }
  }

  return (
    <Modal isOpen={true} onOpenChange={(open) => !open && onClose()} size="sm" classNames={{
      base: "bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl",
      header: "bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-100 dark:border-slate-800/40",
      body: "p-5 space-y-4",
      footer: "pt-2 border-t border-slate-100 dark:border-slate-800"
    }}>
      <ModalContent>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Edit Customer Identity
            </h3>
          </ModalHeader>

          <ModalBody>
            {showConfirm ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Are you sure you want to save these changes?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will immediately update the customer's identity across all linked segments and telemetry.
                </p>
              </div>
            ) : (
              <>
                <Input
                  label="First Name"
                  labelPlacement="outside"
                  placeholder="Enter first name"
                  isRequired
                  value={firstName}
                  onValueChange={setFirstName}
                  variant="bordered"
                  radius="md"
                  classNames={{
                    base: "mb-2",
                    label: "text-xs font-bold text-slate-700 dark:text-slate-300 pb-1",
                    inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800",
                    input: "text-sm text-slate-700 dark:text-slate-300"
                  }}
                />
                <Input
                  label="Last Name"
                  labelPlacement="outside"
                  placeholder="Enter last name"
                  value={lastName}
                  onValueChange={setLastName}
                  variant="bordered"
                  radius="md"
                  classNames={{
                    base: "mb-2",
                    label: "text-xs font-bold text-slate-700 dark:text-slate-300 pb-1",
                    inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800",
                    input: "text-sm text-slate-700 dark:text-slate-300"
                  }}
                />
                <PhoneInput
                  label="Phone Number"
                  labelPlacement="outside"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={setPhone}
                  variant="bordered"
                  radius="md"
                  classNames={{
                    base: "mb-2",
                    label: "text-xs font-bold text-slate-700 dark:text-slate-300 pb-1",
                    inputWrapper: "bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 pl-0",
                    input: "text-sm text-slate-700 dark:text-slate-300 ml-2"
                  }}
                />
              </>
            )}
          </ModalBody>

          <ModalFooter>
            {showConfirm ? (
              <>
                <Button variant="light" onPress={() => setShowConfirm(false)} radius="lg" className="text-xs font-bold text-slate-600 dark:text-slate-400 h-[28px] min-h-0">
                  Back
                </Button>
                <Button type="submit" isLoading={isPending} color="success" radius="lg" className="text-xs font-bold text-white shadow-sm h-[28px] min-h-0">
                  {isPending ? "Saving..." : "Confirm & Save"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="light" onPress={onClose} radius="lg" className="text-xs font-bold text-slate-600 dark:text-slate-400 h-[28px] min-h-0">
                  Cancel
                </Button>
                <Button type="submit" color="primary" radius="lg" className="text-xs font-bold shadow-sm h-[28px] min-h-0">
                  Save Identity
                </Button>
              </>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
