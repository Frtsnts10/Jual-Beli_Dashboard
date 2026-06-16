"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { Input, Button } from "@heroui/react";
import { signUpAction } from "@/features/auth/actions/auth-actions";

export default function NativeSignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <div className="w-full max-w-md bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-xl mb-4 shadow-lg shadow-violet-500/25">
          ✨
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Create Console Shard</h2>
        <p className="text-xs text-indigo-300 mt-1 uppercase tracking-widest font-bold">Provision Auth Profile Shard</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
            {state.error}
          </div>
        )}

        {state?.success && state?.message && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
            {state.message}
          </div>
        )}

        <div>
          <Input
            type="text"
            name="fullName"
            label="Full Name"
            isRequired
            placeholder="Store Executive"
            variant="faded"
            classNames={{
              inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
              input: "text-white placeholder:text-slate-500",
              label: "text-slate-300"
            }}
          />
        </div>

        <div>
          <Input
            type="email"
            name="email"
            label="Email Address"
            isRequired
            placeholder="executive@premium-storefronts.com"
            variant="faded"
            classNames={{
              inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
              input: "text-white placeholder:text-slate-500",
              label: "text-slate-300"
            }}
          />
        </div>

        <div>
          <Input
            type="password"
            name="password"
            label="Secure Password"
            isRequired
            placeholder="••••••••••••"
            variant="faded"
            classNames={{
              inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
              input: "text-white placeholder:text-slate-500",
              label: "text-slate-300"
            }}
          />
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20"
          size="lg"
          radius="lg"
        >
          {isPending ? "Provisioning Shard..." : "Initialize Profile"}
        </Button>
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
