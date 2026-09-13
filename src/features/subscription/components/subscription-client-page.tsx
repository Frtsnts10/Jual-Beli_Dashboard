"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, ShieldCheck, Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCheckoutSessionAction } from "../server/subscription-actions";
import { useI18n } from "@/hooks/use-i18n";

interface SubscriptionClientPageProps {
  storeId: string;
  isPaymentSuccess: boolean;
  isSubscribed: boolean;
  plan: string;
  tier?: string;
  status: string;
  currentPeriodEnd: number | null;
  currency: string;
}

export function SubscriptionClientPage({
  storeId,
  isPaymentSuccess: initialPaymentSuccess,
  isSubscribed,
  plan,
  tier,
  status,
  currentPeriodEnd,
  currency
}: SubscriptionClientPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(initialPaymentSuccess);
  const [billingInterval, setBillingInterval] = useState<"weekly" | "monthly" | "yearly" | "lifetime">("monthly");

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        // Clean URL to remove the query parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_success');
        router.replace(url.pathname + url.search);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  const handleUpgrade = async () => {
    setIsPending(true);
    const returnUrl = typeof window !== "undefined" ? window.location.href : "";
    const res = await createCheckoutSessionAction(storeId, returnUrl, billingInterval, "pro");
    if (res?.url) {
      window.location.href = res.url;
    } else {
      alert(`Failed to provision routing session: ${res?.error || "Ensure MIDTRANS keys are bound."}`);
      setIsPending(false);
    }
  };

  const formatPrice = (usdAmount: number) => {
    if (currency.toUpperCase() === "IDR") {
      const amount = usdAmount * 15000;
      const formatted = new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(amount);
      return formatted.replace(/Rp\s?/g, 'Rp');
    }
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(usdAmount);
  };

  // Pricing structure matching homepage exactly
  const pricingData = {
    weekly: {
      price: formatPrice(9),
      suffix: "/wk",
      label: "Pro Weekly",
      desc: t.subscription.proFeatures ? "Short-term power for digital empires." : "",
      features: [
        "Unlimited Store Workspaces",
        "Unlimited Credential Storage",
        "Automated WhatsApp Delivery (n8n)",
      ],
    },
    monthly: {
      price: formatPrice(29),
      suffix: "/mo",
      label: "Pro Monthly",
      desc: "Unlimited power for digital empires.",
      mostPopular: true,
      features: [
        "Unlimited Store Workspaces",
        "Unlimited Credential Storage",
        "Automated WhatsApp Delivery (n8n)",
        "Smart Family Pool Automation",
      ],
    },
    yearly: {
      price: formatPrice(59),
      suffix: "/yr",
      label: "Pro Yearly",
      desc: "Save 30% on annual billing.",
      features: [
        "Unlimited Store Workspaces",
        "Unlimited Credential Storage",
        "Automated WhatsApp Delivery (n8n)",
        "Smart Family Pool Automation",
        "Cross-Tenant Analytics Engine",
        "Priority Support Access",
      ],
    },
    lifetime: {
      price: formatPrice(99),
      suffix: " once",
      label: "Pro Lifetime",
      desc: "Pay once, own forever.",
      features: [
        "Unlimited Store Workspaces",
        "Unlimited Credential Storage",
        "Automated WhatsApp Delivery (n8n)",
        "Smart Family Pool Automation",
        "Cross-Tenant Analytics Engine",
        "Priority Support Access",
        "Lifetime Core Updates",
        "No recurring subscription",
      ],
    },
  };

  const freeFeatures = [
    "Up to 1 Store Workspace",
    "Store up to 100 Credentials",
    "Basic Stock & Expiry Tracking",
    "Copy-to-Clipboard Features",
  ];

  const currentPlan = pricingData[billingInterval];

  const isProActive = isSubscribed && (
    (billingInterval === "weekly" && plan.toLowerCase().includes("week")) ||
    (billingInterval === "monthly" && plan.toLowerCase().includes("month")) ||
    (billingInterval === "yearly" && plan.toLowerCase().includes("year")) ||
    (billingInterval === "lifetime" && !plan.toLowerCase().includes("week") && !plan.toLowerCase().includes("month") && !plan.toLowerCase().includes("year") && plan !== "free")
  );

  return (
    <div className="space-y-4 font-sans pb-4 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 dark:border-slate-800/80 pb-3 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-slate-100 tracking-tight">{t.subscription.title}</h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{t.subscription.description}</p>
        </div>
      </div>

      {showSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start sm:items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-bounce-once transition-all">
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
      <div className="p-4 bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider">{t.subscription.statusTitle}</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isSubscribed ? "bg-blue-50 dark:bg-indigo-950/40 text-blue-700 dark:text-indigo-400 border border-blue-200/60 dark:border-indigo-900/40" : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
            }`}>
              {status === "active" ? t.subscription.statusActive : status === "inactive" ? t.subscription.statusInactive : status}
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-slate-100 capitalize flex items-center gap-2">
            {plan === "free" ? "Standard (Free)" : plan} 
            {isSubscribed && <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
          </h3>
          {currentPeriodEnd ? (
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              {t.subscription.billingEnd} <span className="font-mono font-medium">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
            </p>
          ) : isSubscribed ? (
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              {plan.toLowerCase().includes("month") ? "Active Billing Vector: Monthly" : 
               plan.toLowerCase().includes("year") ? "Active Billing Vector: Yearly" : 
               plan.toLowerCase().includes("week") ? "Active Billing Vector: Weekly" : 
               t.subscription.activeVector}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-50 dark:from-indigo-950/40 to-violet-50 dark:to-violet-950/20 text-blue-600 dark:text-indigo-400 rounded-lg border border-blue-100/40 dark:border-indigo-900/40 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900 dark:text-slate-100">{t.subscription.slaTelemetry}</p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">{t.subscription.slaDesc}</p>
          </div>
        </div>
      </div>

      {/* Pricing Section — Matching Homepage */}
      <div className="pt-2">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-slate-100">Simple, Scalable Plans</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Choose the perfect tier for your commerce operations.</p>
        </div>

        <div className="w-full">
          {/* Interval Selector Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-stone-100 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800/80 p-1.5 rounded-lg flex gap-1 shadow-sm relative transition-all">
              <button
                onClick={() => setBillingInterval("weekly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  billingInterval === "weekly"
                    ? "bg-blue-600 text-white shadow-sm scale-102"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.weekly}
              </button>
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  billingInterval === "monthly"
                    ? "bg-blue-600 text-white shadow-sm scale-102"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.monthly}
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative cursor-pointer ${
                  billingInterval === "yearly"
                    ? "bg-blue-600 text-white shadow-sm scale-102"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.yearly}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg shadow-md animate-pulse">
                  {t.subscription.save30}
                </span>
              </button>
              <button
                onClick={() => setBillingInterval("lifetime")}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative cursor-pointer ${
                  billingInterval === "lifetime"
                    ? "bg-blue-600 text-white shadow-sm scale-102"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
                }`}
              >
                {t.subscription.lifetime}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg shadow-md animate-pulse">
                  {t.subscription.bestValue}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Standard (Free) Card */}
            <div className="h-full px-6 py-5 bg-white dark:bg-[#0d1322] rounded-lg border border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between relative transition-colors">
              <div>
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Standard
                  </div>
                </div>
                <h3 className="text-3xl font-black text-stone-900 dark:text-slate-100 mb-1">Free</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Perfect for single-store operations starting out.
                </p>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-slate-300 font-medium">
                  {freeFeatures.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 mt-6 border-t border-stone-100 dark:border-slate-800 transition-colors">
                <button
                  disabled
                  className="w-full py-2.5 bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 text-xs font-bold rounded-xl text-center transition-colors"
                >
                  {isSubscribed ? t.subscription.includedInPackage : "Get Started Free"}
                </button>
              </div>
            </div>

            {/* Pro Card — Dynamic based on interval */}
            <div className="h-full px-6 py-5 bg-gradient-to-br from-blue-950 via-stone-900 to-blue-900 rounded-lg border border-blue-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white transition-colors">
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 p-3">
                <Sparkles className="w-16 h-16 text-blue-500/10" />
              </div>

              <div className="relative z-10">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    {currentPlan.label}
                  </div>
                  {"mostPopular" in currentPlan && currentPlan.mostPopular && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-md">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="mb-2 animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-4xl font-black text-white">{currentPlan.price}</span>
                  <span className="text-base text-blue-300/80 font-bold">{currentPlan.suffix}</span>
                </div>
                <p className="text-xs text-blue-200/70 mb-4 leading-relaxed">
                  {currentPlan.desc}
                </p>
                <ul className="space-y-3 text-sm text-blue-100/90 font-medium">
                  {currentPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                      <CheckCircle2 className={`w-4.5 h-4.5 shrink-0 ${billingInterval === "lifetime" ? "text-amber-400" : "text-blue-400"}`} />
                      <span className={feature.startsWith("Everything") || feature === "Priority Support Access" ? "text-white font-semibold" : ""}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 mt-6 border-t border-white/10 relative z-10">
                <button
                  onClick={handleUpgrade}
                  disabled={isPending || isProActive}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 active:scale-95 text-white text-xs font-bold rounded-xl text-center shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? t.subscription.connecting : isProActive ? "Current Active Package" : `Upgrade to ${billingInterval.charAt(0).toUpperCase() + billingInterval.slice(1)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
