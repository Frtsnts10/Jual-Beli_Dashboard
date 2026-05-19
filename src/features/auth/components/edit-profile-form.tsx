"use client";

import React, { useTransition, useState } from "react";
import { User, Mail, Lock, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/use-i18n";

export function EditProfileForm({
  initialName,
  initialEmail,
  initial2fa,
}: {
  initialName: string;
  initialEmail: string;
  initial2fa: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enable2fa, setEnable2fa] = useState(initial2fa);
  const { t } = useI18n();

  // MFA Setup State
  const [mfaStep, setMfaStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle');
  const [mfaData, setMfaData] = useState<{ qrCode?: string; secret?: string; factorId?: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isMfaPending, setIsMfaPending] = useState(false);

  const supabase = createClient();

  const handleStart2fa = async () => {
    setIsMfaPending(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Shop Dashboard",
        friendlyName: initialEmail
      });

      if (error) throw error;

      setMfaData({
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      });
      setMfaStep('verifying');
    } catch (err: any) {
      setError(err.message || "Failed to initiate 2FA enrollment");
    } finally {
      setIsMfaPending(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!mfaData?.factorId || otpCode.length !== 6) return;
    
    setIsMfaPending(true);
    setError(null);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: mfaData.factorId
      });

      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaData.factorId,
        challengeId: challenge.id,
        code: otpCode
      });

      if (verifyErr) throw verifyErr;

      setEnable2fa(true);
      setMfaStep('idle');
      setMessage("2FA (Google Authenticator) successfully synchronized and activated.");
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsMfaPending(false);
    }
  };

  const handleRevoke2fa = async () => {
    setIsMfaPending(true);
    setError(null);
    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;

      const totpFactor = factors.totp.find((f: any) => f.status === 'verified');
      if (!totpFactor) {
        setEnable2fa(false);
        return;
      }

      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id
      });

      if (unenrollErr) throw unenrollErr;

      setEnable2fa(false);
      setMessage("2FA (Google Authenticator) has been revoked and disabled.");
    } catch (err: any) {
      setError(err.message || "Failed to revoke 2FA");
    } finally {
      setIsMfaPending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("enable2fa", String(enable2fa));

    startTransition(async () => {
      const res = await updateProfileAction(null, formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setMessage(res.message || "Properties synchronized cleanly");
      }
    });
  };

  return (
    <div className="h-full p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-sm shadow-sm font-sans flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-500" /> {t.profile.profileTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.profile.profileSubtitle}
          </p>
        </div>

        {(message || (enable2fa && !initial2fa) || (!enable2fa && initial2fa)) && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-sm flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-bounce-once">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.profile.profileSuccessTitle}</p>
              <p>{message || t.profile.profileSavePending}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-sm flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300 animate-shake-soft">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.profile.profileErrorTitle}</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.profile.labelFullName}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                name="fullName"
                defaultValue={initialName}
                required
                className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.profile.labelAuthEmail}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                type="email"
                name="email"
                defaultValue={initialEmail}
                required
                className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {t.profile.labelResetPassword}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type="password"
              name="password"
              placeholder={t.profile.placeholderPassword}
              className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/50 dark:bg-[#0b0f19]/50 border border-slate-100 dark:border-slate-800 rounded-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {t.profile.label2faTitle}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {enable2fa 
                  ? t.profile.label2faActiveDesc 
                  : t.profile.label2faInactiveDesc}
              </p>
            </div>
            {!enable2fa && mfaStep === 'idle' && (
              <button
                type="button"
                onClick={handleStart2fa}
                disabled={isMfaPending}
                className="h-[34px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isMfaPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                {t.profile.btnSetup2fa}
              </button>
            )}
            {enable2fa && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-sm text-[9px] font-black uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3" /> {t.profile.statusActive}
                </div>
                <button
                  type="button"
                  onClick={handleRevoke2fa}
                  disabled={isMfaPending}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isMfaPending ? t.profile.revoking : t.profile.btnRevoke2fa}
                </button>
              </div>
            )}
          </div>

          {mfaStep === 'verifying' && mfaData && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {mfaData.qrCode ? (
                  <div className="p-2 bg-white rounded-sm border border-slate-200">
                    <img src={mfaData.qrCode} alt="MFA QR Code" className="w-32 h-32" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-sm text-[10px] text-slate-400 text-center p-2">
                    QR Code Incompatible
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {t.profile.mfaStepScan}<br/>
                    {t.profile.mfaStepVerify}
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">{t.profile.labelVerifyCode}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-[34px] px-3 bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-sm font-mono tracking-[0.3em] text-center focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerify2fa}
                        disabled={isMfaPending || otpCode.length !== 6}
                        className="h-[34px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-sm transition-all cursor-pointer"
                      >
                        {isMfaPending ? "Verifying..." : t.profile.btnConfirmVerify}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMfaStep('idle')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    {t.profile.btnCancelVerify}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || mfaStep !== 'idle'}
            className="h-[38px] px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-[13px] font-bold rounded-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isPending ? t.profile.btnApplyingProfile : t.profile.btnApplyProfile}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
