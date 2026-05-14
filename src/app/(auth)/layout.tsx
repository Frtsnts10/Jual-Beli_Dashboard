import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6 text-center">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            Authentication Hub
          </span>
          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">Shop Dashboard</h1>
          <p className="text-xs text-indigo-200/60 mt-1">Multi-Tenant Store Management Gateway</p>
        </div>
        {children}
      </div>
    </div>
  );
}
