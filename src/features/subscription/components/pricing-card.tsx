"use client";

import React, { useState } from "react";
import { Check, Zap, Sparkles } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";

interface PricingCardProps {
  storeId: string;
  isSubscribed: boolean;
}

export function PricingCard({ storeId, isSubscribed }: PricingCardProps) {
  const [isPending, setIsPending] = useState(false);

  const handleUpgrade = async () => {
    setIsPending(true);
    const returnUrl = typeof window !== "undefined" ? window.location.href : "";
    const res = await createCheckoutSessionAction(storeId, returnUrl);
    if (res?.url) {
      window.location.href = res.url;
    } else {
      alert("Failed to provision routing session. Ensure STRIPE keys are bound.");
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto font-sans transition-colors">
      {/* Free tier card */}
      <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between opacity-90 relative transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Base Tier</span>
            <span className="text-[10px] bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-sm font-bold transition-colors">
              Default Active
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Standard Core</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Essential data logging setup for simple proof-of-concept workspaces.
          </p>
          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900 dark:text-slate-100">$0</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold"> / month forever</span>
          </div>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>Up to 3 Active Stores</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>Basic SKU ingestion stream</span>
            </li>
            <li className="flex items-center gap-2.5 text-slate-300 dark:text-slate-700 line-through">
              <Check className="w-4 h-4 shrink-0" />
              <span>Advanced telemetry grids</span>
            </li>
            <li className="flex items-center gap-2.5 text-slate-300 dark:text-slate-700 line-through">
              <Check className="w-4 h-4 shrink-0" />
              <span>Live Stripe SLA Syncing</span>
            </li>
          </ul>
        </div>
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <button
            disabled
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-sm text-center transition-colors"
          >
            {isSubscribed ? "Included in your package" : "Active Core Bound"}
          </button>
        </div>
      </div>

      {/* Enterprise tier card */}
      <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-sm border border-indigo-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white transition-colors">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Premium Enterprise
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-sm font-bold">
              Recommended
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Shop Dashboard Pro</h3>
          <p className="text-xs text-indigo-200/70 mb-6 leading-relaxed">
            Unlimited scale vectors supporting absolute multitenant live boundary operations.
          </p>
          <div className="mb-6">
            <span className="text-4xl font-black text-white">$49</span>
            <span className="text-xs text-indigo-300/80 font-bold"> / workspace month</span>
          </div>
          <ul className="space-y-3 text-xs text-indigo-100/90 font-medium">
            <li className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400" />
              <span>Unlimited Store Shards</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400" />
              <span>Advanced @tanstack/react-table telemetry grids</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400" />
              <span>Instant Stripe SLA automatic bindings</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400" />
              <span>Priority Customer Desk SLA cycle actions</span>
            </li>
          </ul>
        </div>
        <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-95 text-white text-xs font-bold rounded-sm text-center shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? "Connecting Secure Vector..." : isSubscribed ? "Simulate Stripe Gateway" : "Upgrade Workspace Shard"}
          </button>
        </div>
      </div>
    </div>
  );
}
