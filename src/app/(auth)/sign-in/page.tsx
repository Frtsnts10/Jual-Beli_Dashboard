"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button } from "@heroui/react";
import { signInWithEmailAndPassword, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, getMultiFactorResolver, MultiFactorResolver, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

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
      throw new Error(data.stack ? `${data.error}\nStack: ${data.stack}` : data.error || "Failed to create session");
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

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleSession(userCredential);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
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

          <div className="space-y-4">
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

            <div>
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="••••••••••••"
                isRequired
                variant="faded"
                classNames={{
                  inputWrapper: "bg-black/40 border-white/10 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 data-[focus=true]:bg-black/60",
                  input: "text-white placeholder:text-slate-500",
                  label: "text-slate-300"
                }}
              />
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 border-none"
          >
            {isPending ? "Authenticating..." : "Sign In"}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-wider font-bold">Or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            isLoading={isPending}
            variant="flat"
            className="w-full bg-white hover:bg-slate-100 text-slate-900 border border-white/10 font-bold flex items-center justify-center gap-2 shadow-lg shadow-white/5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
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
