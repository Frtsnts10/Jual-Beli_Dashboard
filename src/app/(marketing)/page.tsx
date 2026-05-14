import React from "react";
import Link from "next/link";
import { Sparkles, Layers, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden font-sans">
      {/* Sleek top navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xl tracking-wider">
              Ω
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              Shop Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm hover:shadow transition-all group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Open Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
          {/* Subtle decorative background blur balls */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-violet-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Next-Generation Multi-Tenant Commerce Shell</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight max-w-5xl mx-auto leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            Manage Multiple Premium Stores with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Supreme Agility.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Unify your inventory streams, dispatch resolving mechanisms for critical VIP complaints, and command analytics across partitioned storefront instances effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base"
            >
              <Zap className="w-5 h-5 fill-white/20" />
              Launch Premium Console
            </Link>
          </div>

          {/* Premium UI Mockup Showcase */}
          <div className="mt-16 max-w-5xl mx-auto relative rounded-3xl p-3 bg-slate-900/5 backdrop-blur-xl border border-slate-900/10 shadow-2xl animate-in zoom-in-95 duration-1000">
            <div className="bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-100">
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-4 px-3 py-1 bg-white border border-slate-200/60 rounded-md text-[11px] text-slate-400 font-mono w-64 truncate text-left">
                  shopdashboard.premium/dashboard
                </div>
              </div>
              <div className="p-8 text-left bg-gradient-to-br from-slate-50/50 to-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold">
                      🏪
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Tokyo Flagship Hub</h4>
                      <p className="text-[11px] text-slate-400">Multi-tenant active sandbox</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded-full border border-emerald-100 uppercase tracking-wider">
                      ● Active Store
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Live SKU Count</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">1,482</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">VIP Loyalty Pool</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">849</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Open Incidents</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">0 Pending</p>
                  </div>
                </div>

                <div className="h-28 rounded-xl bg-gradient-to-r from-indigo-50/50 via-violet-50/50 to-pink-50/50 border border-indigo-100/40 flex items-center justify-center border-dashed">
                  <p className="text-xs font-medium text-indigo-400">Interactive live widgets rendered securely inside tenant dashboard boundaries</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High-End Feature Breakdown */}
        <section className="py-24 bg-white border-y border-slate-100 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Architected for Supreme Command
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Every tool crafted specifically to elevate operations manager throughput.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-indigo-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Partitioned Data Flow</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Switch store contexts immediately via highly optimized query wrappers backed by Supabase Server Actions. Zero cross-tenant data leakage.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-violet-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Complaints SLA Desk</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Categorize user feedback seamlessly. Interactive custom badging automatically handles status pipelines between Investigating and Fully Resolved.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50/60 border border-slate-100 hover:border-pink-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Blazing CRUD Speed</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fully native responsive database tables with built-in instant optimistic transitions. No external heavyweight API layer required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span>Shop Dashboard Premium Management Suite</span>
          </div>
          <div className="flex gap-6">
            <span>© 2026 Crafted with rich web aesthetics.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
