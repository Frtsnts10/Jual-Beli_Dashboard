"use client";

import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export function UpgradeModal({ isOpen, onClose, storeId }: UpgradeModalProps) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsPending(true);
    const returnUrl = typeof window !== "undefined" ? window.location.href : "";
    const res = await createCheckoutSessionAction(storeId, returnUrl);
    if (res?.url) {
      window.location.href = res.url;
    } else {
      alert("Failed to provision routing session. Ensure STRIPE configuration references are set.");
      setIsPending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} backdrop="blur" classNames={{
      base: "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-500/30 rounded-3xl shadow-2xl",
    }}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upgrade Active Workspace</h3>
                  <p className="text-[10px] text-indigo-200/70">Unlock live API matrices and unlimited multi-tenant scales</p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <p className="text-xs text-indigo-100/90 leading-relaxed py-2 border-y border-white/10">
                Your free workspace has triggered limit warnings. Secure this instance with a professional multi-tenant subscription to avoid log drops.
              </p>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                className="text-xs font-bold text-slate-300 hover:text-white"
                radius="sm"
              >
                Stay on Base Tier
              </Button>
              <Button
                onPress={handleUpgrade}
                isLoading={isPending}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold shadow-lg"
                radius="sm"
              >
                {isPending ? "Routing vector..." : "Upgrade Now"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
