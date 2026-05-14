"use client";

import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-500/30 rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Upgrade Active Workspace</h3>
            <p className="text-[10px] text-indigo-200/70">Unlock live API matrices and unlimited multi-tenant scales</p>
          </div>
        </div>

        <p className="text-xs text-indigo-100/90 leading-relaxed mb-6 border-y border-white/10 py-4">
          Your free workspace has triggered limit warnings. Secure this instance with a professional multi-tenant subscription to avoid log drops.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors rounded-sm"
          >
            Stay on Base Tier
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPending}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-lg transition-all"
          >
            {isPending ? "Routing vector..." : "Upgrade Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
