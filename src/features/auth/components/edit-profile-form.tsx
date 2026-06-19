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
    <div className="h-full p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans flex flex-col justify-between transition-colors">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-500" /> {t.profile.profileTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">
            {t.profile.profileSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.profile.labelFullName}
              </label>
              <Input
                name="fullName"
                defaultValue={initialName}
                isRequired
                startContent={<User className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.profile.labelAuthEmail}
              </label>
              <Input
                type="email"
                name="email"
                defaultValue={initialEmail}
                isRequired
                startContent={<Mail className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
            </div>
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
              <option value="admin">Administrator (Akses Tulis Langsung)</option>
              <option value="staff">Staff Member (Draft / PR Approvals Only)</option>
            </select>
            <p className="text-[10px] text-slate-500">
              Untuk tujuan pengujian, Anda dapat mengubah peran Anda. Staf akan merutekan pengeditan melalui Alur Kerja Persetujuan Data (Sistem Penyusunan).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            {/* Password fields */}
            <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="currentPassword"
                placeholder="Diperlukan untuk mengatur kata sandi baru"
                value={currentPassword}
                onValueChange={setCurrentPassword}
                startContent={<Key className="w-3.5 h-3.5 text-slate-400" />}
                endContent={
                  <button className="focus:outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400 pointer-events-none" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 pointer-events-none" />
                    )}
                  </button>
                }
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                New Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="Biarkan kosong untuk mempertahankan saat ini"
                value={newPassword}
                onValueChange={setNewPassword}
                startContent={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
            </div>

              {newPassword && (
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Strength</span>
                    <span className={strength < 50 ? "text-rose-500" : strength < 75 ? "text-amber-500" : "text-emerald-500"}>
                      {strength < 50 ? "Weak" : strength < 75 ? "Good" : "Strong"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strength < 50 ? "bg-rose-500" : strength < 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Confirm Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Ketik ulang kata sandi baru"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                startContent={<CheckCircle className="w-3.5 h-3.5 text-slate-400" />}
                isInvalid={confirmPassword.length > 0 && !passwordsMatch}
                errorMessage={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
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
