"use client";

import React, { useTransition, useState } from "react";
import { User, Mail, Shield, CheckCircle, Loader2, AlertCircle, Eye, EyeOff, Lock, Smartphone, Key } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";
import { MfaEnrollment } from "./mfa-enrollment";
import { auth } from "@/lib/firebase/client";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { t } = useI18n();

  // Password Strength Logic
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) score += 25;
    if (pwd.match(/\d/)) score += 25;
    if (pwd.match(/[^a-zA-Z\d]/)) score += 25;
    return score;
  };
  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    if (newPassword) {
      if (!passwordsMatch) {
        toast.error("New passwords do not match.");
        return;
      }
      if (strength < 50) {
        toast.error("New password is too weak.");
        return;
      }
      if (!currentPassword) {
        toast.error("Current password is required to change password.");
        return;
      }

      // Re-authenticate Client
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("Session invalid. Please log out and back in.");
        return;
      }
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      } catch (err: any) {
        toast.error("Incorrect current password.");
        return;
      }
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProfileAction(null, formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        toast.success(res.message || t.profile.profileSuccessTitle);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="h-full p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-stone-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-500" /> {t.profile.profileTitle}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 mb-5">
            {t.profile.profileSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {t.profile.labelFullName}
              </label>
              <Input
                name="fullName"
                defaultValue={initialName}
                isRequired
                startContent={<User className="w-3.5 h-3.5 text-stone-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
                  input: "text-xs font-bold text-stone-800 dark:text-slate-100"
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {t.profile.labelAuthEmail}
              </label>
              <Input
                type="email"
                name="email"
                defaultValue={initialEmail}
                isRequired
                startContent={<Mail className="w-3.5 h-3.5 text-stone-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
                  input: "text-xs font-bold text-stone-800 dark:text-slate-100"
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              {t.profile.labelWorkspaceRole}
            </label>
            <select
              name="role"
              defaultValue={initialRole}
              className="w-full bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 rounded-lg h-10 px-3 text-xs font-bold text-stone-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="admin">{t.profile.roleAdmin}</option>
              <option value="staff">{t.profile.roleStaff}</option>
            </select>
            <p className="text-[10px] text-stone-500">
              {t.profile.roleDisclaimer}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-stone-200/60 dark:border-slate-800/80">
            {/* Password fields */}
            <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {t.profile.labelCurrentPassword}
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                placeholder={t.profile.placeholderCurrentPassword}
                value={currentPassword}
                onValueChange={setCurrentPassword}
                startContent={<Key className="w-3.5 h-3.5 text-stone-400" />}
                endContent={
                  <button className="focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-400 pointer-events-none" />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-400 pointer-events-none" />
                    )}
                  </button>
                }
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
                  input: "text-xs font-bold text-stone-800 dark:text-slate-100"
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {t.profile.labelNewPassword}
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder={t.profile.placeholderNewPassword}
                value={newPassword}
                onValueChange={setNewPassword}
                startContent={<Lock className="w-3.5 h-3.5 text-stone-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
                  input: "text-xs font-bold text-stone-800 dark:text-slate-100"
                }}
              />
            </div>

              {newPassword && (
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-stone-500">{t.profile.passwordStrength}</span>
                    <span className={strength < 50 ? "text-rose-500" : strength < 75 ? "text-amber-500" : "text-emerald-500"}>
                      {strength < 50 ? t.profile.passwordWeak : strength < 75 ? t.profile.passwordGood : t.profile.passwordStrong}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strength < 50 ? "bg-rose-500" : strength < 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {t.profile.labelConfirmPassword}
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t.profile.placeholderConfirmPassword}
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                startContent={<CheckCircle className="w-3.5 h-3.5 text-stone-400" />}
                isInvalid={confirmPassword.length > 0 && !passwordsMatch}
                errorMessage={confirmPassword.length > 0 && !passwordsMatch ? t.profile.passwordMismatch : undefined}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
                  input: "text-xs font-bold text-stone-800 dark:text-slate-100"
                }}
              />
            </div>
            </div>

            <Button
              type="submit"
              isLoading={isPending}
              color="primary"
              radius="lg"
              className="w-full text-[13px] font-bold shadow-md h-[42px]"
            >
              {isPending ? t.profile.btnApplyingProfile : t.profile.btnApplyProfile}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
