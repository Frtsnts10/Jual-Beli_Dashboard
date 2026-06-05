"use client";

import React, { useTransition, useState } from "react";
import { User, Mail, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";
import { useI18n } from "@/hooks/use-i18n";
import { Input, Button } from "@heroui/react";

export function EditProfileForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);

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

        {message && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-sm flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-bounce-once">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.profile.profileSuccessTitle}</p>
              <p>{message}</p>
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
              <Input
                name="fullName"
                label={t.profile.labelFullName}
                defaultValue={initialName}
                isRequired
                startContent={<User className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
                  label: "text-[10px] font-bold text-slate-400 uppercase tracking-wider",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />

              <Input
                type="email"
                name="email"
                label={t.profile.labelAuthEmail}
                defaultValue={initialEmail}
                isRequired
                startContent={<Mail className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
                  label: "text-[10px] font-bold text-slate-400 uppercase tracking-wider",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={isPending}
              color="primary"
              radius="sm"
              className="text-[13px] font-bold shadow-md px-6 h-[38px]"
            >
              {isPending ? t.profile.btnApplyingProfile : t.profile.btnApplyProfile}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
