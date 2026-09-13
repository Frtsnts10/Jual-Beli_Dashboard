"use client";

import React, { useState } from "react";
import { X, PlusCircle, Sparkles } from "lucide-react";
import { createStoreAction } from "../actions/manage-stores";
import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
}

export function AddStoreModal({ isOpen, onClose, profileId }: AddStoreModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createStoreAction(profileId, formData);

    setIsPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      onClose();
      if (res.data?.id) {
        router.push(`/${res.data.id}/dashboard`);
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} backdrop="blur" classNames={{
      base: "bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-3xl shadow-2xl",
    }}>
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <ModalHeader className="flex flex-col gap-1 mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 w-max rounded-full bg-blue-50 dark:bg-indigo-950/50 border border-blue-100 dark:border-indigo-900/40 text-[10px] font-black text-blue-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                <Sparkles className="w-2.5 h-2.5 animate-spin" /> Provision Gateway
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-slate-100 tracking-tight">
                Create Workspace Toko
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-normal leading-relaxed">
                Initialize an isolated premium tenant partition mapping streaming inventory pools and dedicated SLA vector blocks.
              </p>
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-lg font-bold">
                  {error}
                </div>
              )}

              <Input
                id="name"
                name="name"
                label="Storefront Workspace Name"
                isRequired
                autoFocus
                placeholder="e.g. Premium Hub Outlets"
                variant="faded"
                classNames={{
                  inputWrapper: "bg-stone-50/80 dark:bg-[#0b0f19] border-stone-200 dark:border-slate-800 hover:border-blue-500/50 data-[focus=true]:border-blue-500",
                  label: "text-stone-400",
                  input: "text-stone-800 dark:text-slate-100 font-bold placeholder:font-normal"
                }}
              />
            </ModalBody>

            <ModalFooter className="border-t border-stone-50 dark:border-slate-800/60 mt-4">
              <Button
                variant="light"
                onPress={onClose}
                className="text-xs font-bold text-stone-500 dark:text-slate-400"
                radius="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10"
                radius="lg"
              >
                {isPending ? "Allocating Partition..." : "Initialize Workspace"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
