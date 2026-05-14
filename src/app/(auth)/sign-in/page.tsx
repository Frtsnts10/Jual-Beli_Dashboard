"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/features/auth/actions/auth-actions";

export default function NativeSignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-8 shadow-2xl shadow-indigo-500/5 transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-500/25">
          Ω
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
        <p className="text-xs text-slate-500 mt-1">Sign in to your centralized dashboard console</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="admin@premium-storefronts.com"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••••••"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isPending ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have a console account yet?{" "}
          <Link href="/sign-up" className="text-indigo-600 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
