"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/features/auth/actions/auth-actions";
import { useRouter } from "next/navigation";

export default function NativeSignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const router = useRouter();

  React.useEffect(() => {
    if (state?.requiresMfa) {
      router.push("/verify-mfa");
    } else if (state?.success) {
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <div className="w-full bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
        <p className="text-[11px] text-indigo-300 mt-1 uppercase tracking-widest font-bold">Terminal Access Gate</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="admin@premium-storefronts.com"
            className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
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
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-slate-400">
          Don&apos;t have a console account yet?{" "}
          <Link href="/sign-up" className="text-indigo-400 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
