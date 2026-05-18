"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Check, Zap, CheckCircle2 } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";

interface SubscriptionClientPageProps {
  storeId: string;
  isPaymentSuccess: boolean;
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  currency: string;
}

const translations = {
  id: {
    title: "Manajemen Tagihan & Kuota",
    description: "Tinjau batas kuota database saat ini dan aktifkan jalur telemetri tingkat premium.",
    paymentSuccessTitle: "Transaksi Pembayaran Berhasil Diotorisasi!",
    paymentSuccessDesc: "Jabat tangan simulasi telah mengaktifkan batas PCI-DSS standar. Status paket diperbarui menjadi Shop Dashboard Pro di seluruh klaster persisten.",
    statusTitle: "Status Telemetri Paket",
    statusActive: "Aktif",
    statusInactive: "Tidak Aktif",
    matrixLevel: "Tingkat Matriks",
    activeVector: "Vektor Tagihan Aktif: Seumur Hidup (Akses Tanpa Batas)",
    billingEnd: "Tanggal berakhir tagihan aktif: ",
    slaTelemetry: "Telemetri Aktif SLA",
    slaDesc: "Kait PostgreSQL tersinkronisasi",
    provisionTitle: "Skala Sumber Daya Penyediaan",
    provisionDesc: "Tingkatkan shard aktif Anda untuk melewati batas API secara instan",
    
    monthly: "Bulanan",
    yearly: "Tahunan",
    lifetime: "Seumur Hidup",
    save30: "Hemat 30%",
    bestValue: "Nilai Terbaik",
    
    baseTier: "Tingkat Dasar",
    defaultActive: "Aktif Default",
    standardCoreTitle: "Core Standar",
    standardCoreDesc: "Pengaturan pencatatan data penting untuk ruang kerja bukti konsep sederhana.",
    monthForever: " / bulan selamanya",
    freeFeatures: [
      "Hingga 3 Toko Shard Aktif",
      "Aliran penyerapan SKU dasar",
      "Kisi telemetri tingkat lanjut (terkunci)",
      "Sinkronisasi Live Stripe SLA (terkunci)"
    ],
    activeCoreBound: "Batas Core Aktif",
    includedInPackage: "Termasuk dalam paket Anda",
    
    premiumEnterprise: "Perusahaan Premium",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Vektor skala tak terbatas yang mendukung operasi batas langsung multi-penyewa absolut.",
    workspaceMonth: " / bulan ruang kerja",
    workspaceYear: " / tahun ruang kerja",
    oneTimeLifetime: " / seumur hidup sekali bayar",
    ctaMonthly: "Tingkatkan Shard Bulanan",
    ctaYearly: "Tingkatkan Shard Tahunan",
    ctaLifetime: "Dapatkan Akses Seumur Hidup",
    proFeatures: {
      monthly: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas"
      ],
      yearly: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas",
        "Susunan webhook pengembang khusus prioritas",
        "Sinkronisasi audit kepatuhan PCI-DSS tahunan"
      ],
      lifetime: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas",
        "Lisensi seumur hidup - Miliki selamanya",
        "Tanpa biaya langganan berulang",
        "Semua pembaruan premium masa depan disertakan"
      ]
    },
    connecting: "Menghubungkan Vektor Aman...",
    simulateStripe: "Simulasikan Stripe Gateway"
  },
  en: {
    title: "Billing & Quota Management",
    description: "Review current database quota bounds and trigger premium tier telemetry paths.",
    paymentSuccessTitle: "Payment Transaction Authorized Successfully!",
    paymentSuccessDesc: "Simulated handshakes have activated standard PCI-DSS boundaries. Plan status updated to Shop Dashboard Pro across persistent clusters.",
    statusTitle: "Plan Telemetry Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    matrixLevel: "Matrix Level",
    activeVector: "Active Billing Vector: Lifetime (Infinite Access)",
    billingEnd: "Billing active vector end string: ",
    slaTelemetry: "SLA Active Telemetry",
    slaDesc: "PostgreSQL hooks synchronized",
    provisionTitle: "Provision Resource Scales",
    provisionDesc: "Upgrade your active shard to bypass API limits instantly",
    
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    save30: "Save 30%",
    bestValue: "Best Value",
    
    baseTier: "Base Tier",
    defaultActive: "Default Active",
    standardCoreTitle: "Standard Core",
    standardCoreDesc: "Essential data logging setup for simple proof-of-concept workspaces.",
    monthForever: " / month forever",
    freeFeatures: [
      "Up to 3 Active Store Shards",
      "Basic SKU ingestion stream",
      "Advanced telemetry grids (locked)",
      "Live Stripe SLA Syncing (locked)"
    ],
    activeCoreBound: "Active Core Bound",
    includedInPackage: "Included in your package",
    
    premiumEnterprise: "Premium Enterprise",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Unlimited scale vectors supporting absolute multitenant live boundary operations.",
    workspaceMonth: " / workspace month",
    workspaceYear: " / workspace year",
    oneTimeLifetime: " / one-time lifetime",
    ctaMonthly: "Upgrade Monthly Shard",
    ctaYearly: "Upgrade Yearly Shard",
    ctaLifetime: "Acquire Lifetime Access",
    proFeatures: {
      monthly: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions"
      ],
      yearly: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Priority dedicated developer webhook arrays",
        "Annual PCI-DSS compliance audits sync"
      ],
      lifetime: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Lifetime license - Own it forever",
        "Zero recurring subscription costs",
        "All future premium updates included"
      ]
    },
    connecting: "Connecting Secure Vector...",
    simulateStripe: "Simulate Stripe Gateway"
  }
};

export function SubscriptionClientPage({
  storeId,
  isPaymentSuccess,
  isSubscribed,
  plan,
  status,
  currentPeriodEnd,
  currency
}: SubscriptionClientPageProps) {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [isPending, setIsPending] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly" | "lifetime">("monthly");

  const t = translations[lang];

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
      suffix: t.workspaceMonth,
      cta: t.ctaMonthly,
      badge: "Standard Premium",
      features: t.proFeatures.monthly
    },
    yearly: {
      price: formatPrice(59),
      suffix: t.workspaceYear,
      cta: t.ctaYearly,
      badge: "Premium Saver",
      features: t.proFeatures.yearly
    },
    lifetime: {
      price: formatPrice(99),
      suffix: t.oneTimeLifetime,
      cta: t.ctaLifetime,
      badge: "Best Value",
      features: t.proFeatures.lifetime
    }
  };

  const currentPricing = pricingData[billingInterval];

  return (
    <div className="space-y-8 font-sans pb-12 animate-in fade-in duration-300">
      {/* Header with i18n switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
        </div>

        {/* Premium Flag Toggle Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-sm shadow-xs self-start sm:self-center transition-colors">
          <button
            onClick={() => setLang("id")}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              lang === "id"
                ? "bg-indigo-600 text-white shadow-xs scale-102 font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>🇮🇩</span> <span>ID</span>
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              lang === "en"
                ? "bg-indigo-600 text-white shadow-xs scale-102 font-black"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>🇺🇸</span> <span>EN</span>
          </button>
        </div>
      </div>

      {isPaymentSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-start sm:items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-bounce-once">
          <div className="p-2 bg-emerald-500 text-white rounded-sm shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {t.paymentSuccessTitle}
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              {t.paymentSuccessDesc}
            </p>
          </div>
        </div>
      )}

      {/* Localized Status Panel */}
      <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.statusTitle}</span>
            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isSubscribed ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {status === "active" ? t.statusActive : status === "inactive" ? t.statusInactive : status}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
            {plan === "free" ? t.standardCoreTitle : plan === "Shop Dashboard Pro (Monthly)" || plan === "Shop Dashboard Pro (Yearly)" || plan === "Shop Dashboard Pro (Lifetime)" || plan === "Shop Dashboard Pro" ? t.proTitle : plan} {t.matrixLevel}
            {isSubscribed && <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          </h3>
          {currentPeriodEnd ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.billingEnd} <span className="font-mono font-medium">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
            </p>
          ) : isSubscribed ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.activeVector}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/40 to-violet-50 dark:to-violet-950/20 text-indigo-600 dark:text-indigo-400 rounded-sm border border-indigo-100/40 dark:border-indigo-900/40 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.slaTelemetry}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.slaDesc}</p>
          </div>
        </div>
      </div>

      {/* Pricing and interval selector section */}
      <div className="pt-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.provisionTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.provisionDesc}</p>
        </div>

        <div className="max-w-4xl mx-auto">
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
                {t.monthly}
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all relative cursor-pointer ${
                  billingInterval === "yearly"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.yearly}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
                  {t.save30}
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
                {t.lifetime}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
                  {t.bestValue}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free tier card */}
            <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between opacity-90 relative transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.baseTier}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-sm font-bold transition-colors">
                    {t.defaultActive}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t.standardCoreTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {t.standardCoreDesc}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{formatPrice(0)}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{t.monthForever}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {t.freeFeatures.map((feature, i) => (
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
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-sm text-center transition-colors"
                >
                  {isSubscribed ? t.includedInPackage : t.activeCoreBound}
                </button>
              </div>
            </div>

            {/* Pro tier card */}
            <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-sm border border-indigo-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white transition-colors">
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> {t.premiumEnterprise}
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-sm font-bold">
                    {currentPricing.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{t.proTitle}</h3>
                <p className="text-xs text-indigo-200/70 mb-6 leading-relaxed">
                  {t.proDesc}
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
                  {isPending ? t.connecting : isSubscribed ? t.simulateStripe : currentPricing.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
