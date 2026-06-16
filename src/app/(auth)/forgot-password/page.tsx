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
    <div className="w-full bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl transition-all">
      <div className="mb-6">
        <Link href="/sign-in" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">Reset Password</h2>
        <p className="text-[11px] text-indigo-300 mt-1 uppercase tracking-widest font-bold">Terminal Access Recovery</p>
      </div>

      {success ? (
        <div className="text-center py-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <MailCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Check your inbox</h3>
          <p className="text-slate-400 text-sm mb-8">
            We've sent a secure recovery link to your email address.
          </p>
          <Link href="/sign-in">
            <Button
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold shadow-lg border border-white/10"
            >
              Return to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-slate-400 text-center mb-6">
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
                inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
                input: "text-white placeholder:text-slate-500",
                label: "text-slate-300"
              }}
            />
          </div>

          <Button
            type="submit"
            isLoading={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 border-none"
          >
            {isPending ? "Sending Link..." : "Send Reset Link"}
          </Button>
        </form>
      )}
    </div>
  );
}
