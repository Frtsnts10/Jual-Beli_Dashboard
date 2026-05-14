"use client";

import React, { useState } from "react";
import { X, PlusCircle, Sparkles } from "lucide-react";
import { createStoreAction } from "../actions/manage-stores";
import { useRouter } from "next/navigation";

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
    /* Premium Ultra-Light Glass Backdrop Tint keeping text cleanly visible */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/15 backdrop-blur-[2px] animate-in fade-in duration-300 p-4">
      {/* Sleek Gleaming Container with rich top accent glow */}
      <div className="relative w-full max-w-md p-7 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Subtle premium ambient top header gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
          title="Close dialog overlay"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
            <Sparkles className="w-2.5 h-2.5 animate-spin" /> Provision Gateway
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Create Workspace Shard
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Initialize an isolated premium tenant partition mapping streaming inventory pools and dedicated SLA vector blocks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-xl font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Storefront Workspace Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Premium Hub Outlets"
              className="w-full px-4 py-3 bg-slate-50/80 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              {isPending ? "Allocating Partition..." : "Initialize Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
