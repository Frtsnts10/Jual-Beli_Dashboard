"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle, Info } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false
}: ConfirmModalProps) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} backdrop="blur" classNames={{
      base: `bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-2xl border ${danger ? 'border-red-500/50 dark:border-red-900/50' : 'border-white/80 dark:border-slate-800'} rounded-3xl shadow-2xl`,
    }}>
      <ModalContent>
        {() => (
          <>
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${danger ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} />
            
            <ModalHeader className="flex flex-col gap-1 mt-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 w-max rounded-full border text-[10px] font-black uppercase tracking-widest mb-2 ${
                danger 
                  ? 'bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              }`}>
                {danger ? <AlertTriangle className="w-2.5 h-2.5" /> : <Info className="w-2.5 h-2.5" />}
                {danger ? 'Action Required' : 'Confirmation'}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h3>
            </ModalHeader>

            <ModalBody>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                {description}
              </p>
            </ModalBody>

            <ModalFooter className="border-t border-slate-50 dark:border-slate-800/60 mt-4">
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={isPending}
                className="text-xs font-bold text-slate-500 dark:text-slate-400"
                radius="lg"
              >
                {cancelText}
              </Button>
              <Button
                onPress={handleConfirm}
                isLoading={isPending}
                className={`text-white text-xs font-bold shadow-md ${
                  danger 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-red-600/10'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-indigo-600/10'
                }`}
                radius="lg"
              >
                {isPending ? "Processing..." : confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
