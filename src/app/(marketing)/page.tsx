import React from "react";
import Link from "next/link";
import { Sparkles, Layers, ShieldCheck, Zap, ArrowRight, CheckCircle2, MonitorPlay, Bot, LockKeyhole } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-x-hidden font-sans">
      {/* Sleek top navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xl tracking-wider">
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
            <span>Next-Generation Digital Subscription OS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight max-w-5xl mx-auto leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            Manage Digital Subscriptions with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Supreme Agility.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Unify your credential streams, automate family pool partitioning, and seamlessly distribute premium slots for Netflix, Spotify, ChatGPT, and more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-lg shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base"
            >
              <Zap className="w-5 h-5 fill-white/20" />
              Launch Premium Console
            </Link>
          </div>

          {/* Premium UI Mockup Showcase */}
          <div className="mt-16 max-w-5xl mx-auto relative rounded-lg sm:rounded-3xl p-1.5 sm:p-3 bg-slate-900/5 backdrop-blur-xl border border-slate-900/10 shadow-2xl animate-in zoom-in-95 duration-1000">
            <div className="bg-white rounded-lg sm:rounded-lg overflow-hidden shadow-inner border border-slate-100">
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-4 px-3 py-1 bg-white border border-slate-200/60 rounded-lg text-[11px] text-slate-400 font-mono w-40 sm:w-64 truncate text-left">
                  shopdashboard.premium/dashboard
                </div>
              </div>
              <div className="p-4 sm:p-8 text-left bg-gradient-to-br from-slate-50/50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                      🏪
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Tokyo Flagship Hub</h4>
                      <p className="text-[11px] text-slate-400">Multi-tenant active sandbox</p>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded-full border border-emerald-100 uppercase tracking-wider">
                      ● Active Store
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Active Subscriptions</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">1,482</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Available Slots</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">849</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Expiring Soon</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">12 Slots</p>
                  </div>
                </div>

                <div className="min-h-24 py-6 px-4 rounded-lg bg-gradient-to-r from-indigo-50/50 via-violet-50/50 to-pink-50/50 border border-indigo-100/40 flex items-center justify-center border-dashed">
                  <p className="text-xs font-medium text-indigo-400 text-center">Interactive live widgets rendered securely inside tenant dashboard boundaries</p>
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
              <div className="p-8 rounded-lg bg-slate-50/60 border border-slate-100 hover:border-indigo-100 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Tier Partitioning</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Automatically split and assign credentials (e.g., 1 User, Private Upgrade, Family Slot) dynamically based on the streaming platform or digital product.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-slate-50/60 border border-slate-100 hover:border-violet-100 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Credential Vault</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Safely store master emails, passwords, and 4-digit PINs. Equipped with instant-copy UI interfaces for rapid customer fulfillment via WhatsApp or chat.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-slate-50/60 border border-slate-100 hover:border-pink-100 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Expiry & Stock Alerts</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time stock counts for available profile slots and automatic, color-coded alerts for upcoming master subscription renewals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Platforms Showcase */}
        <section className="py-24 bg-slate-900 px-6 overflow-hidden relative">
          {/* Decorative background gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute top-1/4 -right-64 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Intelligent Auto-Tiering Engine
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                Massive Out-of-the-Box Support
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Just type the product name. Our engine instantly detects the brand and generates the exact sub-tiers and profile slots you need to resell.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Streaming Box */}
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all backdrop-blur-sm group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Streaming & Media</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Netflix", "Disney+", "HBO Max", "Prime Video", "Hulu", "Crunchyroll", "Spotify"].map(brand => (
                    <span key={brand} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs font-medium border border-white/5">
                      {brand}
                    </span>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Auto-Splits Into:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 User / 2 User Profiles</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Semi-Private Slots</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Private Account Upgrades</li>
                  </ul>
                </div>
              </div>

              {/* Productivity Box */}
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all backdrop-blur-sm group">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">AI & Productivity</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["ChatGPT Plus", "Canva Pro", "Grammarly", "Microsoft 365", "Google One", "Zoom", "CapCut"].map(brand => (
                    <span key={brand} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs font-medium border border-white/5">
                      {brand}
                    </span>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Auto-Splits Into:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Team Member Invites</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Admin Access Seats</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Premium Shared Workspaces</li>
                  </ul>
                </div>
              </div>

              {/* VPN Box */}
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all backdrop-blur-sm group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <LockKeyhole className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">VPN & Security</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["NordVPN", "ExpressVPN", "Surfshark", "CyberGhost", "PIA"].map(brand => (
                    <span key={brand} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs font-medium border border-white/5">
                      {brand}
                    </span>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Auto-Splits Into:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Individual Device Slots</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5-Device Family Pools</li>
                    <li className="flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dedicated Private IPs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing/Features Comparison */}
        <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Simple, Scalable Plans
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Choose the perfect tier for your commerce operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Standard Tier */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest mb-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    Standard
                  </div>
                  <h3 className="text-4xl font-black text-slate-900">Free</h3>
                  <p className="text-sm text-slate-500 mt-2">Perfect for single-store operations starting out.</p>
                </div>
                <div className="flex-1 space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Up to 1 Store Workspace</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Store up to 100 Credentials</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Basic Stock & Expiry Tracking</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Copy-to-Clipboard Features</span>
                  </div>
                </div>
                <Link href="/dashboard" className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-center text-sm transition-colors">
                  Get Started Free
                </Link>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0b0f19] to-slate-900 border border-indigo-500/30 shadow-xl shadow-indigo-500/10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <Sparkles className="w-24 h-24 text-indigo-500/10" />
                </div>
                <div className="mb-6 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-4">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Pro Member
                  </div>
                  <h3 className="text-4xl font-black text-white">$29<span className="text-lg text-slate-400 font-medium">/mo</span></h3>
                  <p className="text-sm text-indigo-200 mt-2">Unlimited power for digital empires.</p>
                </div>
                <div className="flex-1 space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-white font-medium">Unlimited Store Workspaces</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Unlimited Credential Storage</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Automated WhatsApp Delivery (n8n)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Smart Family Pool Automation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span>Cross-Tenant Analytics Engine</span>
                  </div>
                </div>
                <Link href="/dashboard" className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold rounded-xl text-center text-sm shadow-md shadow-indigo-500/25 transition-all relative z-10">
                  Upgrade to Pro
                </Link>
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
