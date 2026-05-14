"use client";

import React, { useTransition, useState } from "react";
import { User, Mail, Lock, Shield, Image as ImageIcon, CheckCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";

export function EditProfileForm({
  initialName,
  initialEmail,
  initialAvatar,
  initial2fa,
  initialRestData = "{}",
}: {
  initialName: string;
  initialEmail: string;
  initialAvatar: string;
  initial2fa: boolean;
  initialRestData?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enable2fa, setEnable2fa] = useState(initial2fa);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [restData, setRestData] = useState(initialRestData);

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

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  return (
    <div className="h-full p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-sm shadow-sm font-sans flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-500" /> User Profile & Security Descriptors
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage identity parameter attributes mapped directly to Supabase Authentication instances.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-sm flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-bounce-once">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Execution Confirmed</p>
              <p>{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-sm flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300 animate-shake-soft">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Synchronization Fault</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Full Designation Name
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
              Authentication Email
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
            Override Password Payload
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type="password"
              name="password"
              placeholder="Leave array completely empty to retain active secret payload"
              className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Avatar Render URL String
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ImageIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="url"
                name="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={generateRandomAvatar}
              className="h-[34px] px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-sm font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Randomize
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Supplementary Context Data JSON Matrix (Rest Attributes)
          </label>
          <textarea
            name="restData"
            rows={2}
            value={restData}
            onChange={(e) => setRestData(e.target.value)}
            placeholder='{"role": "Super Admin", "region": "US-East"}'
            className="w-full p-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* 2FA Integration Switch */}
        <div className="p-3.5 bg-slate-50/50 dark:bg-[#0b0f19]/50 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Two-Factor Factor Synchronization (2FA)
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enforce cryptographic hardware hooks across incoming user sessions natively.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnable2fa(!enable2fa)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enable2fa ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                enable2fa ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="h-[34px] px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isPending ? "Syncing Identity Layer..." : "Apply Authentication Updates"}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
