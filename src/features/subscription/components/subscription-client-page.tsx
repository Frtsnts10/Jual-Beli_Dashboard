"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, ShieldCheck, Check, Zap } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";
import { useI18n } from "@/hooks/use-i18n";

interface SubscriptionClientPageProps {
  storeId: string;
  isPaymentSuccess: boolean;
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: number | null;
  currency: string;
}

export function SubscriptionClientPage({
  storeId,
  isPaymentSuccess,
  isSubscribed,
  plan,
  status,
  currentPeriodEnd,
  currency
}: SubscriptionClientPageProps) {
  const { t } = useI18n();
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

  const formatPrice = (usdAmount: number) => {
    if (currency.toUpperCase() === "IDR") {
      const amount = usdAmount * 15000;
      return new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(usdAmount);
  };

  const pricingData = {
    monthly: {
      price: formatPrice(29),
      suffix: t.subscription.workspaceMonth,
      cta: t.subscription.ctaMonthly,
      badge: "Standard Premium",
      features: t.subscription.proFeatures.monthly
    },
    yearly: {
      price: formatPrice(59),
      suffix: t.subscription.workspaceYear,
      cta: t.subscription.ctaYearly,
      badge: "Premium Saver",
      features: t.subscription.proFeatures.yearly
    },
    lifetime: {
      price: formatPrice(99),
      suffix: t.subscription.oneTimeLifetime,
      cta: t.subscription.ctaLifetime,
      badge: "Best Value",
      features: t.subscription.proFeatures.lifetime
    }
  };

  const currentPricing = pricingData[billingInterval];

  return (
    <div className="space-y-8 font-sans pb-12 animate-in fade-in duration-300">
      {/* Page Header (No local switcher - clean settings bind) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.subscription.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.subscription.description}</p>
        </div>
      </div>

      {isPaymentSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start sm:items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-bounce-once">
          <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {t.subscription.paymentSuccessTitle}
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              {t.subscription.paymentSuccessDesc}
            </p>
          </div>
        </div>
      )}

      {/* Localized Status Panel */}
      <div className="p-6 bg-white dark:bg-[#0d1322] rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.subscription.statusTitle}</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isSubscribed ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {status === "active" ? t.subscription.statusActive : status === "inactive" ? t.subscription.statusInactive : status}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
            {plan === "free" ? t.subscription.standardCoreTitle : plan === "Shop Dashboard Pro (Monthly)" || plan === "Shop Dashboard Pro (Yearly)" || plan === "Shop Dashboard Pro (Lifetime)" || plan === "Shop Dashboard Pro" ? t.subscription.proTitle : plan} {t.subscription.matrixLevel}
            {isSubscribed && <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          </h3>
          {currentPeriodEnd ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.subscription.billingEnd} <span className="font-mono font-medium">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
            </p>
          ) : isSubscribed ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.subscription.activeVector}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/40 to-violet-50 dark:to-violet-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.subscription.slaTelemetry}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.subscription.slaDesc}</p>
          </div>
        </div>
      </div>

      {/* Pricing and interval selector section */}
      <div className="pt-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.subscription.provisionTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.subscription.provisionDesc}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Dynamic Pills Interval Selector Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-slate-100 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 p-1.5 rounded-xl flex gap-1 shadow-sm relative transition-all">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  billingInterval === "monthly"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.monthly}
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative cursor-pointer ${
                  billingInterval === "yearly"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.yearly}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-md animate-pulse">
                  {t.subscription.save30}
                </span>
              </button>
              <button
                onClick={() => setBillingInterval("lifetime")}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative cursor-pointer ${
                  billingInterval === "lifetime"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.lifetime}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-md animate-pulse">
                  {t.subscription.bestValue}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free tier card */}
            <div className="p-6 bg-white dark:bg-[#0d1322] rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between opacity-90 relative transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.subscription.baseTier}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-lg font-bold transition-colors">
                    {t.subscription.defaultActive}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t.subscription.standardCoreTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {t.subscription.standardCoreDesc}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{formatPrice(0)}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{t.subscription.monthForever}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {t.subscription.freeFeatures.map((feature, i) => (
                    <li key={i} className={`flex items-center gap-2.5 ${i >= 2 ? "text-slate-300 dark:text-slate-700 line-through" : ""}`}>
                      <Check className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <button
                  disabled
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-lg text-center transition-colors"
                >
                  {isSubscribed ? t.subscription.includedInPackage : t.subscription.activeCoreBound}
                </button>
              </div>
            </div>

            {/* Pro tier card */}
            <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-xl border border-indigo-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white transition-colors">
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> {t.subscription.premiumEnterprise}
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-lg font-bold">
                    {currentPricing.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{t.subscription.proTitle}</h3>
                <p className="text-xs text-indigo-200/70 mb-6 leading-relaxed">
                  {t.subscription.proDesc}
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
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-95 text-white text-xs font-bold rounded-lg text-center shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? t.subscription.connecting : isSubscribed ? t.subscription.simulateStripe : currentPricing.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
