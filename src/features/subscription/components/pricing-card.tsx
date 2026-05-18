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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly" | "lifetime">("monthly");

  const handleUpgrade = async () => {
    setIsPending(true);
    const returnUrl = typeof window !== "undefined" ? window.location.href : "";
    const res = await createCheckoutSessionAction(storeId, returnUrl, billingInterval);
    if (res?.url) {
      window.location.href = res.url;
    } else {
      alert("Failed to provision routing session. Ensure STRIPE keys are bound.");
      setIsPending(false);
    }
  };

  const pricingData = {
    monthly: {
      price: "$29",
      suffix: " / workspace month",
      cta: "Upgrade Monthly Shard",
      badge: "Standard Premium",
      features: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions"
      ]
    },
    yearly: {
      price: "$59",
      suffix: " / workspace year",
      cta: "Upgrade Yearly Shard",
      badge: "Premium Saver (Save 30%)",
      features: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Priority dedicated developer webhook arrays",
        "Annual PCI-DSS compliance audits sync"
      ]
    },
    lifetime: {
      price: "$99",
      suffix: " / one-time lifetime",
      cta: "Acquire Lifetime Access",
      badge: "Best Value (Lifetime)",
      features: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Lifetime license - Own it forever",
        "Zero recurring subscription costs",
        "All future premium updates included"
      ]
    }
  };

  const currentPricing = pricingData[billingInterval];

  return (
    <div className="max-w-4xl mx-auto font-sans transition-colors">
      {/* Dynamic Pills Interval Selector Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-100 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 p-1 rounded-sm flex gap-1 shadow-sm relative transition-all">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
              billingInterval === "monthly"
                ? "bg-indigo-600 text-white shadow-sm scale-102"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all relative cursor-pointer ${
              billingInterval === "yearly"
                ? "bg-indigo-600 text-white shadow-sm scale-102"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Yearly
            <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
              Save 30%
            </span>
          </button>
          <button
            onClick={() => setBillingInterval("lifetime")}
            className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all relative cursor-pointer ${
              billingInterval === "lifetime"
                ? "bg-indigo-600 text-white shadow-sm scale-102"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Lifetime
            <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
              Best Value
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> Premium Enterprise
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-sm font-bold">
                {currentPricing.badge}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Shop Dashboard Pro</h3>
            <p className="text-xs text-indigo-200/70 mb-6 leading-relaxed">
              Unlimited scale vectors supporting absolute multitenant live boundary operations.
            </p>
            <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-4xl font-black text-white">{currentPricing.price}</span>
              <span className="text-xs text-indigo-300/80 font-bold">{currentPricing.suffix}</span>
            </div>
            <ul className="space-y-3 text-xs text-indigo-100/90 font-medium">
              {currentPricing.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                  <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400 animate-pulse" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
            <button
              onClick={handleUpgrade}
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-95 text-white text-xs font-bold rounded-sm text-center shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? "Connecting Secure Vector..." : isSubscribed ? "Simulate Stripe Gateway" : currentPricing.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
