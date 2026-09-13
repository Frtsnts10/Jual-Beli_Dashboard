"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input, Button } from "@heroui/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email) {
      setError("Please enter your email address.");
      setIsPending(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.code === "auth/user-not-found" 
        ? "No account found with this email."
        : err.message || "Failed to send reset email.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[32px] border border-stone-200 p-8 shadow-xl transition-all">
      <div className="mb-6">
        <Link href="/sign-in" className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-stone-900">Reset Password</h2>
        <p className="text-[11px] text-blue-600 mt-1 uppercase tracking-widest font-bold">Terminal Access Recovery</p>
      </div>

      {success ? (
        <div className="text-center py-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <MailCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-stone-900 font-bold text-lg mb-2">Check your inbox</h3>
          <p className="text-stone-500 text-sm mb-8">
            We've sent a secure recovery link to your email address.
          </p>
          <Link href="/sign-in">
            <Button
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold shadow-sm border border-stone-200"
            >
              Return to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-stone-500 text-center mb-6">
              Enter the email address associated with your dashboard account and we'll send you a link to reset your password.
            </p>
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="admin@premium-storefronts.com"
              isRequired
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 border-none"
          >
            {isPending ? "Sending Link..." : "Send Reset Link"}
          </Button>
        </form>
      )}
    </div>
  );
}
