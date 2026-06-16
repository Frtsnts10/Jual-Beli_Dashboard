"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import { signInWithEmailAndPassword, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, getMultiFactorResolver, MultiFactorResolver } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function NativeSignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [mfaStep, setMfaStep] = useState<"idle" | "code">("idle");
  const router = useRouter();

  const handleSession = async (userCredential: any) => {
    const idToken = await userCredential.user.getIdToken();

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create session");
    }

    router.push("/dashboard");
    router.refresh();
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-signin", {
        size: "invisible",
      });
    }
  };

  const handleSendMfaCode = async (resolver: MultiFactorResolver) => {
    try {
      setupRecaptcha();
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session,
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);
      setVerificationId(vid);
      setMfaStep("code");
    } catch (err: any) {
      setError("Failed to send MFA code: " + err.message);
      setIsPending(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !verificationCode) return;
    
    setIsPending(true);
    setError(null);
    
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      await handleSession(userCredential);
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
      setIsPending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Email and password are required");
      setIsPending(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSession(userCredential);
    } catch (err: any) {
      if (err.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
        await handleSendMfaCode(resolver);
        return; // Don't reset isPending here, handled by handleSendMfaCode
      }
      
      const msg = err.code === "auth/invalid-credential"  
        ? "Invalid email or password." 
        : err.code === "auth/too-many-requests"
        ? "Too many failed attempts. Please try again later."
        : err.message || "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full bg-[#0d1322]/40 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8 shadow-2xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black tracking-tight text-white">Welcome Back</h2>
        <p className="text-[11px] text-indigo-300 mt-1 uppercase tracking-widest font-bold">Terminal Access Gate</p>
      </div>

      {mfaResolver ? (
        <form onSubmit={handleVerifyMfa} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}
          
          <div id="recaptcha-signin"></div>

          <div>
            <label className="text-xs text-slate-300 block mb-2">We sent a verification code to your phone.</label>
            <Input
              type="text"
              name="verificationCode"
              label="6-Digit Code"
              isRequired
              maxLength={6}
              placeholder="000 000"
              value={verificationCode}
              onValueChange={setVerificationCode}
              variant="faded"
              classNames={{
                inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
                input: "text-white placeholder:text-slate-500 text-center font-mono text-xl tracking-[0.5em]",
                label: "text-slate-300"
              }}
            />
          </div>

          <Button
            type="submit"
            isLoading={isPending}
            isDisabled={mfaStep !== "code"}
            className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20"
            size="lg"
            radius="lg"
          >
            {isPending ? "Verifying..." : "Confirm Identity"}
          </Button>

          <Button
            variant="light"
            onPress={() => {
              setMfaResolver(null);
              setMfaStep("idle");
              setIsPending(false);
            }}
            className="w-full text-[11px] text-slate-500 hover:text-white transition-colors"
          >
            Back to Email/Password
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <Input
              type="email"
              name="email"
              label="Email Address"
              isRequired
              placeholder="admin@premium-storefronts.com"
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
              label="Password"
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
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20"
            size="lg"
            radius="lg"
          >
            {isPending ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      )}

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
