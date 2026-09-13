"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { Input, Button } from "@heroui/react";
import { signUpAction } from "@/features/auth/actions/auth-actions";

export default function NativeSignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] border border-stone-200 p-8 shadow-xl transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 text-white font-bold text-xl mb-4 shadow-lg shadow-violet-500/25">
          ✨
        </div>
        <h2 className="text-2xl font-black tracking-tight text-stone-900">Create Console Toko</h2>
        <p className="text-xs text-blue-600 mt-1 uppercase tracking-widest font-bold">Provision Auth Profile Toko</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {state.error}
          </div>
        )}

        {state?.success && state?.message && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
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
              inputWrapper: "bg-white border-stone-200 hover:border-blue-400 data-[focus=true]:border-blue-600 data-[focus=true]:bg-white",
              input: "text-stone-900 placeholder:text-stone-400",
              label: "text-stone-600"
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
              inputWrapper: "bg-white border-stone-200 hover:border-blue-400 data-[focus=true]:border-blue-600 data-[focus=true]:bg-white",
              input: "text-stone-900 placeholder:text-stone-400",
              label: "text-stone-600"
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
              inputWrapper: "bg-white border-stone-200 hover:border-blue-400 data-[focus=true]:border-blue-600 data-[focus=true]:bg-white",
              input: "text-stone-900 placeholder:text-stone-400",
              label: "text-stone-600"
            }}
          />
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full mt-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20"
          size="lg"
          radius="lg"
        >
          {isPending ? "Provisioning Toko..." : "Initialize Profile"}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-stone-200 text-center">
        <p className="text-xs text-stone-500">
          Already mapped an authentication toko?{" "}
          <Link href="/sign-in" className="text-blue-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
