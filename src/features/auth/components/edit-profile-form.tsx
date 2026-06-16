"use client";

import React, { useTransition, useState } from "react";
import { User, Mail, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";
import { useI18n } from "@/hooks/use-i18n";
import { Input, Button } from "@heroui/react";
import { toast } from "sonner";

export function EditProfileForm({
  initialName,
  initialEmail,
  initialRole = "admin",
}: {
  initialName: string;
  initialEmail: string;
  initialRole?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProfileAction(null, formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        toast.success(res.message || t.profile.profileSuccessTitle);
      }
    });
  };

  return (
    <div className="h-full p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-500" /> {t.profile.profileTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.profile.profileSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="fullName"
                label={t.profile.labelFullName}
                defaultValue={initialName}
                isRequired
                startContent={<User className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="lg"
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
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500",
                  label: "text-[10px] font-bold text-slate-400 uppercase tracking-wider",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Workspace Role
            </label>
            <select
              name="role"
              defaultValue={initialRole}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg h-10 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="admin">Administrator (Direct Write Access)</option>
              <option value="staff">Staff Member (Draft / PR Approvals Only)</option>
            </select>
            <p className="text-[10px] text-slate-500">
              For testing purposes, you can switch your role. Staff members will route edits through the Data Approval Workflow (Drafting System).
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={isPending}
              color="primary"
              radius="lg"
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
