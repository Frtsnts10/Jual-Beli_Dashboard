import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { CheckCircle2, ShieldCheck, CreditCard, Lock, ArrowLeft, Sparkles } from "lucide-react";

export default async function SimulatedXenditCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ interval?: string }>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const interval = resolvedSearchParams?.interval || "monthly";

  const storeDoc = await adminDb.collection("stores").doc(storeId).get();

  if (!storeDoc.exists) {
    redirect("/dashboard");
  }

  const store = storeDoc.data()!;
  const currency = store?.currency || "IDR";

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(usdAmount);
  };

  const billingInfo = {
    weekly: {
      price: formatPrice(9),
      description: currency.toUpperCase() === "IDR" ? "Ditagih per minggu kalender aktif" : "Billed per active calendar week",
      mode: currency.toUpperCase() === "IDR" ? "Mingguan" : "Weekly",
      days: 7,
      planName: currency.toUpperCase() === "IDR" ? "Shop Dashboard Pro (Mingguan)" : "Shop Dashboard Pro (Weekly)",
    },
    monthly: {
      price: formatPrice(29),
      description: currency.toUpperCase() === "IDR" ? "Ditagih per siklus kalender aktif" : "Billed per active calendar cycle",
      mode: currency.toUpperCase() === "IDR" ? "Bulanan" : "Monthly",
      days: 30,
      planName: currency.toUpperCase() === "IDR" ? "Shop Dashboard Pro (Bulanan)" : "Shop Dashboard Pro (Monthly)",
    },
    yearly: {
      price: formatPrice(59),
      description: currency.toUpperCase() === "IDR" ? "Ditagih per tahun (Hemat 30%)" : "Billed per year (Save 30%)",
      mode: currency.toUpperCase() === "IDR" ? "Tahunan" : "Yearly",
      days: 365,
      planName: currency.toUpperCase() === "IDR" ? "Shop Dashboard Pro (Tahunan)" : "Shop Dashboard Pro (Yearly)",
    },
    lifetime: {
      price: formatPrice(99),
      description: currency.toUpperCase() === "IDR" ? "Bayar sekali, miliki selamanya" : "Paid once, own forever",
      mode: currency.toUpperCase() === "IDR" ? "Lifetime / Sekali Bayar" : "Lifetime / One-Time",
      days: null as number | null,
      planName: currency.toUpperCase() === "IDR" ? "Shop Dashboard Pro (Lifetime)" : "Shop Dashboard Pro (Lifetime)",
    }
  }[interval as "weekly" | "monthly" | "yearly" | "lifetime"] || {
    price: formatPrice(29),
    description: currency.toUpperCase() === "IDR" ? "Ditagih per siklus kalender aktif" : "Billed per active calendar cycle",
    mode: currency.toUpperCase() === "IDR" ? "Bulanan" : "Monthly",
    days: 30,
    planName: currency.toUpperCase() === "IDR" ? "Shop Dashboard Pro (Bulanan)" : "Shop Dashboard Pro (Monthly)",
  };

  // Server Action to activate subscription
  async function fulfillXenditPaymentAction() {
    "use server";
    
    const expiryDate = billingInfo.days 
      ? new Date(Date.now() + billingInfo.days * 86400000).toISOString()
      : null;

    // 1. Upsert subscription
    const subsRef = adminDb.collection("subscriptions").doc(storeId);
    await subsRef.set({
      store_id: storeId,
      profile_id: store?.owner_id,
      plan: "pro",
      plan_name: billingInfo.planName,
      status: "active",
      xendit_subscription_id: `sub_simulated_${Date.now()}`,
      current_period_end: expiryDate,
    }, { merge: true });

    // 2. Set is_premium in user profile
    if (store?.owner_id) {
      await adminDb.collection("profiles").doc(store.owner_id).update({ is_premium: true });
    }

    redirect(`/${storeId}/subscription?payment_success=true`);
  }

  return (
    <div className="min-h-screen bg-[#043c7b] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#00c5df] selection:text-white">
      {/* Top micro bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link href={`/${storeId}/subscription`} className="flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to Toko Console
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" /> <span>XENDIT TEST GATEWAY SIMULATOR</span>
        </div>
      </header>

      {/* Main Terminal Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-in fade-in duration-300">
        {/* Left span: Sub summary */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold tracking-wider uppercase">
              Subscription Fulfillment Hook
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight mt-3">{billingInfo.planName}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Target active store pointer mapping: <strong className="text-white">{store.name}</strong>
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Base subscription line item</span>
              <span className="font-mono font-bold text-white">{billingInfo.price}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-white/10">
              <span>{billingInfo.description}</span>
              <span>{billingInfo.mode}</span>
            </div>
            <div className="flex justify-between items-center text-base font-black text-white pt-1">
              <span>Total due today</span>
              <span className="font-mono text-emerald-400">{billingInfo.price}</span>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Immediate unlimited toko deployment
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Synchronized Firestore SLA triggers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Automated n8n lifecycle hooks
            </li>
          </ul>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10 text-xs text-slate-400">
            <ShieldCheck className="w-8 h-8 text-indigo-400 shrink-0" />
            <p>
              Simulating direct PCI-DSS compliant Xendit vector. Sandbox accounts securely capture fulfillment arrays cleanly.
            </p>
          </div>
        </div>

        {/* Right span: Form simulation */}
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  S
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Xendit Payment Gateway</h3>
                  <p className="text-[10px] text-slate-500">Secured sandbox test terminal</p>
                </div>
              </div>
              <div className="flex gap-1">
                <span className="w-8 h-5 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-600">
                  VISA
                </span>
                <span className="w-8 h-5 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-600">
                  MC
                </span>
              </div>
            </div>

            <form action={fulfillXenditPaymentAction} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cardholder Identity
                </label>
                <input
                  type="text"
                  required
                  defaultValue="Jane Premium Streamer"
                  className="w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Card Credentials Sequence
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    defaultValue="4242 •••• •••• 4242"
                    className="w-full h-[38px] pl-3 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Expiration Lifecycle
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue="12 / 29"
                    className="w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    CVC Secret Key
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue="888"
                    className="w-full h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#043c7b] hover:bg-[#062649] active:scale-95 text-white rounded-lg text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                  <span>Authorize Subscription Fulfill ({billingInfo.price})</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400">
                By clicking authorize, you simulate tokenized handshakes mapping straight to active metadata storage bindings.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer credits */}
      <footer className="text-center py-6 text-[11px] text-slate-500 border-t border-white/5">
        Shop Dashboard Multi-Tenant Commerce Architecture Engine • Secured Xendit Simulation Vector
      </footer>
    </div>
  );
}
