"use client";

import React, { useState, useEffect } from "react";
import { Button, Input } from "@heroui/react";
import { auth } from "@/lib/firebase/client";
import { 
  RecaptchaVerifier, 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator 
} from "firebase/auth";
import { Smartphone, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export function MfaEnrollment() {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step, setStep] = useState<"idle" | "phone" | "code">("idle");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already enrolled
    const checkEnrollment = () => {
      const user = auth.currentUser;
      if (user) {
        const enrolledFactors = multiFactor(user).enrolledFactors;
        setIsEnrolled(enrolledFactors.length > 0);
      }
    };
    
    // Auth state observer
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) checkEnrollment();
    });
    
    return () => unsubscribe();
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) return;
    setIsLoading(true);
    
    try {
      setupRecaptcha();
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const session = await multiFactor(user).getSession();
      const phoneInfoOptions = {
        phoneNumber,
        session,
      };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);
      
      setVerificationId(vid);
      setStep("code");
      toast.success("Verification code sent!");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/requires-recent-login" || error.message?.includes("requires-recent-login")) {
        toast.error("For your security, please log out and back in to enable 2FA.", { duration: 6000 });
      } else {
        toast.error(error.message || "Failed to send verification code");
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) return;
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      await multiFactor(user).enroll(multiFactorAssertion, "Primary Phone");
      setIsEnrolled(true);
      setStep("idle");
      toast.success("Multi-Factor Authentication enabled successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Two-Factor Auth Active</h4>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400/80">Your account is highly secure.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-[#0b0f19]/50 gap-3">
      <div id="recaptcha-container"></div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-stone-200/50 dark:bg-slate-800/50 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-stone-900 dark:text-slate-100">Two-Factor Auth</h4>
            <p className="text-[9px] text-stone-500">Protect your account with SMS</p>
          </div>
        </div>
        {step === "idle" && (
          <Button 
            size="sm" 
            color="primary" 
            className="text-[10px] font-bold h-7" 
            onPress={() => setStep("phone")}
          >
            Enable 2FA
          </Button>
        )}
      </div>

      {step === "phone" && (
        <div className="animate-in fade-in slide-in-from-top-2 flex gap-2">
          <Input
            size="sm"
            placeholder="+1 650-555-1234"
            value={phoneNumber}
            onValueChange={setPhoneNumber}
            classNames={{
              inputWrapper: "h-8 bg-white dark:bg-black/40 border-stone-200 dark:border-white/10",
              input: "text-[11px]"
            }}
          />
          <Button 
            size="sm" 
            isLoading={isLoading} 
            onPress={handleSendCode}
            className="h-8 bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold"
          >
            Send
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="animate-in fade-in slide-in-from-top-2 flex gap-2">
          <Input
            size="sm"
            placeholder="123456"
            value={verificationCode}
            onValueChange={setVerificationCode}
            maxLength={6}
            classNames={{
              inputWrapper: "h-8 bg-white dark:bg-black/40 border-stone-200 dark:border-white/10",
              input: "text-[11px] font-mono tracking-widest text-center"
            }}
          />
          <Button 
            size="sm" 
            isLoading={isLoading} 
            onPress={handleVerifyCode}
            className="h-8 bg-emerald-600 text-white text-[10px] font-bold"
          >
            Verify
          </Button>
        </div>
      )}
    </div>
  );
}
