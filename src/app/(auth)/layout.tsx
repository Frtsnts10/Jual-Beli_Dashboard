import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-4 font-sans">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6 text-center">
          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs uppercase tracking-widest">
            Authentication Hub
          </span>
          <h1 className="text-2xl font-black text-stone-900 mt-2 tracking-tight">Shop Dashboard</h1>
          <p className="text-xs text-stone-500 mt-1">Multi-Tenant Store Management Gateway</p>
        </div>
        {children}
      </div>
    </div>
  );
}
