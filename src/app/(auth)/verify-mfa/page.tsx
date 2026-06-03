"use client";

import React, { useState } from "react";
import { Shield, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyMfaPage() {
  const [otpCode, setOtpCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    setIsPending(true);
    setError(null);

    try {
      // Firebase Auth MFA verification would go here.
      // For now, this is a placeholder since Firebase MFA requires
      // specific multi-factor enrollment via the Firebase Client SDK.
      setError("MFA verification is not yet configured for Firebase Auth. Please contact support.");
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white/5 dark:bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-white">Identity Verification</h2>
          <p className="text-[11px] text-indigo-200/40 mt-1 uppercase tracking-widest font-bold mb-6">Secondary Security Vector</p>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-factor authentication is active. <br/>
            Enter the code from your <span className="text-emerald-400 font-bold">Google Authenticator</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-[11px] text-rose-400 animate-shake-soft">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              6-Digit Secure Code
            </label>
            <input
              type="text"
              maxLength={6}
              autoFocus
              placeholder="000 000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl text-2xl font-mono tracking-[0.5em] text-center text-white placeholder:text-white/5 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || otpCode.length !== 6}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Secure Layer...</span>
              </div>
            ) : (
              "Confirm Identity"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/sign-in")}
            className="w-full text-[11px] text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
