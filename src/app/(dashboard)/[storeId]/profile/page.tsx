import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Pengguna",
};

import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/features/auth/components/edit-profile-form";
import { AppearanceSettingsPanel } from "@/features/settings/components/appearance-settings-panel";
import { MfaEnrollment } from "@/features/auth/components/mfa-enrollment";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const storeDoc = await adminDb.collection("stores").doc(storeId).get();

  if (!storeDoc.exists) {
    redirect("/dashboard");
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const profileDoc = await adminDb.collection("profiles").doc(user.uid).get();
  const profile = profileDoc.data() || {};

  const initialName = profile.full_name || user.name || "Workspace Admin";
  const initialEmail = profile.email || user.email || "";
  const initialRole = profile.role || "admin";

  return (
    <div className="space-y-6 font-sans max-w-full pb-12">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profil Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola pengaturan dan preferensi akun pribadi Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-2">
        <div className="flex flex-col gap-6 h-full">
          <EditProfileForm
            initialName={initialName}
            initialEmail={initialEmail}
            initialRole={initialRole}
          />
        </div>
        <div className="flex flex-col gap-6 h-full">
          <AppearanceSettingsPanel />
          <div className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-lg shadow-sm font-sans">
            <MfaEnrollment />
          </div>
        </div>
      </div>
    </div>
  );
}
