"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/features/auth/actions/auth-actions";

export default function NativeSignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <div className="w-full max-w-md bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-xl mb-4 shadow-lg shadow-violet-500/25">
          ✨
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Create Console Shard</h2>
        <p className="text-xs text-indigo-300 mt-1 uppercase tracking-widest font-bold">Provision Auth Profile Shard</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="Store Executive"
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="executive@premium-storefronts.com"
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Secure Password</label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••••••"
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Provisioning Shard..." : "Initialize Profile"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-slate-400">
          Already mapped an authentication shard?{" "}
          <Link href="/sign-in" className="text-violet-400 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
