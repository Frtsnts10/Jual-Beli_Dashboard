"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const error = searchParams.get("error");
  const success = searchParams.get("success");
  
  // If no params are present, it implies it's loading or verifying implicitly
  const isVerifying = !error && !success;

  useEffect(() => {
    if (!isVerifying) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/sign-in");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVerifying, router]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-sm w-full mx-auto p-8 glass-panel rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
      <div className="flex flex-col items-center text-center space-y-4">
        {isVerifying && (
          <>
            <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Verifying your email
            </h1>
            <p className="text-sm text-gray-400">
              Please wait while we confirm your credentials...
            </p>
          </>
        )}

        {success && (
          <>
            <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Email Verified!
            </h1>
            <p className="text-sm text-gray-400">
              Your account is now fully active.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Redirecting to sign in in {countdown}s...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Verification Failed
            </h1>
            <p className="text-sm text-gray-400">
              {error === "true" 
                ? "The verification link is invalid or has expired." 
                : error}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Redirecting to sign in in {countdown}s...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
