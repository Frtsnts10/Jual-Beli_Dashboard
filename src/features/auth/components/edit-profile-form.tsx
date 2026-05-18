"use client";

import React, { useTransition, useState, useEffect } from "react";
import { User, Mail, Lock, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile-action";
import { createClient } from "@/lib/supabase/client";

const translations = {
  id: {
    profileTitle: "Profil Pengguna & Keamanan",
    profileSubtitle: "Kelola atribut parameter identitas yang dipetakan langsung ke instans Autentikasi Supabase.",
    profileSuccessTitle: "Eksekusi Dikonfirmasi",
    profileSavePending: "Perubahan Status 2FA Menunggu Disimpan",
    profileErrorTitle: "Kesalahan Sinkronisasi",
    labelFullName: "Nama Lengkap Pengguna",
    labelAuthEmail: "Email Autentikasi",
    labelResetPassword: "Atur Ulang Kata Sandi Akun",
    placeholderPassword: "Masukkan kata sandi baru untuk memperbarui autentikasi Supabase",
    label2faTitle: "Autentikasi Dua Faktor (Google Authenticator)",
    label2faActiveDesc: "Autentikasi multi-faktor saat ini aktif untuk ruang kerja ini.",
    label2faInactiveDesc: "Terapkan autentikasi multi-faktor (MFA) via Google Authenticator untuk akses aman.",
    btnSetup2fa: "Siapkan 2FA",
    btnRevoke2fa: "Cabut 2FA",
    statusActive: "Aktif",
    mfaStepScan: "1. Pindai kode QR menggunakan aplikasi Google Authenticator.",
    mfaStepVerify: "2. Masukkan 6 digit kode verifikasi di bawah untuk mengonfirmasi sinkronisasi.",
    labelVerifyCode: "Kode Verifikasi",
    btnConfirmVerify: "Konfirmasi Aktivasi",
    btnCancelVerify: "Batalkan Setup",
    btnApplyProfile: "Simpan Pembaruan Profil",
    btnApplyingProfile: "Sinkronisasi Lapisan Identitas...",
    revoking: "Mencabut..."
  },
  en: {
    profileTitle: "User Profile & Security Descriptors",
    profileSubtitle: "Manage identity parameter attributes mapped directly to Supabase Authentication instances.",
    profileSuccessTitle: "Execution Confirmed",
    profileSavePending: "2FA Status Change Pending Save",
    profileErrorTitle: "Synchronization Fault",
    labelFullName: "Full Designation Name",
    labelAuthEmail: "Authentication Email",
    labelResetPassword: "Reset Account Password",
    placeholderPassword: "Enter new password to update Supabase authentication",
    label2faTitle: "Two-Factor Synchronization (Google Authenticator)",
    label2faActiveDesc: "Multi-factor authentication is currently active for this workspace shard.",
    label2faInactiveDesc: "Enforce multi-factor authentication (MFA) via Google Authenticator for secure access.",
    btnSetup2fa: "Setup 2FA",
    btnRevoke2fa: "Revoke 2FA",
    statusActive: "Active",
    mfaStepScan: "1. Scan the QR code using the Google Authenticator app.",
    mfaStepVerify: "2. Enter the 6-digit verification code below to confirm synchronization.",
    labelVerifyCode: "Verification Code",
    btnConfirmVerify: "Confirm Activation",
    btnCancelVerify: "Cancel Setup",
    btnApplyProfile: "Apply Authentication Updates",
    btnApplyingProfile: "Syncing Identity Layer...",
    revoking: "Revoking..."
  },
  es: {
    profileTitle: "Perfil de Usuario y Descriptores de Seguridad",
    profileSubtitle: "Administre atributos de parámetros de identidad asignados directamente a Supabase.",
    profileSuccessTitle: "Ejecución Confirmada",
    profileSavePending: "Cambio de estado de 2FA pendiente de guardar",
    profileErrorTitle: "Fallo de Sincronización",
    labelFullName: "Nombre de Designación Completo",
    labelAuthEmail: "Correo de Autenticación",
    labelResetPassword: "Restablecer Contraseña de Cuenta",
    placeholderPassword: "Ingrese una nueva contraseña para actualizar la autenticación de Supabase",
    label2faTitle: "Sincronización de Dos Factores (Google Authenticator)",
    label2faActiveDesc: "La autenticación multifactor está activa actualmente para este espacio de trabajo.",
    label2faInactiveDesc: "Habilite la autenticación de dos factores (MFA) a través de Google Authenticator para un acceso seguro.",
    btnSetup2fa: "Configurar 2FA",
    btnRevoke2fa: "Revocar 2FA",
    statusActive: "Activo",
    mfaStepScan: "1. Escanee el código QR con la aplicación Google Authenticator.",
    mfaStepVerify: "2. Ingrese el código de verificación de 6 dígitos a continuación.",
    labelVerifyCode: "Código de Verificación",
    btnConfirmVerify: "Confirmar Activación",
    btnCancelVerify: "Cancelar Configuración",
    btnApplyProfile: "Aplicar Actualizaciones de Autenticación",
    btnApplyingProfile: "Sincronizando Capa de Identidad...",
    revoking: "Revocando..."
  },
  fr: {
    profileTitle: "Profil Utilisateur & Sécurité",
    profileSubtitle: "Gerez les paramètres d'identité associés directement à Supabase.",
    profileSuccessTitle: "Exécution Confirmed",
    profileSavePending: "Modification du statut 2FA en attente d'enregistrement",
    profileErrorTitle: "Erreur de Synchronisation",
    labelFullName: "Nom Complet",
    labelAuthEmail: "E-mail d'Authentification",
    labelResetPassword: "Réinitialiser le Mot de Passe",
    placeholderPassword: "Entrez un nouveau mot de passe pour mettre à jour Supabase",
    label2faTitle: "Authentification à Double Facteur (Google Authenticator)",
    label2faActiveDesc: "L'authentification multifactorielle est active pour cet espace de travail.",
    label2faInactiveDesc: "Activez l'authentification forte (MFA) via Google Authenticator pour un accès sécurisé.",
    btnSetup2fa: "Configurer le 2FA",
    btnRevoke2fa: "Révoquer le 2FA",
    statusActive: "Actif",
    mfaStepScan: "1. Scannez le code QR à l'aide de l'application Google Authenticator.",
    mfaStepVerify: "2. Saisissez le code de vérification à 6 chiffres ci-dessous.",
    labelVerifyCode: "Code de Vérification",
    btnConfirmVerify: "Confirmer l'Activation",
    btnCancelVerify: "Annuler la Configuration",
    btnApplyProfile: "Enregistrer le Profil",
    btnApplyingProfile: "Synchronisation de l'identité...",
    revoking: "Révocation..."
  },
  de: {
    profileTitle: "Benutzerprofil & Sicherheitsdeskriptoren",
    profileSubtitle: "Verwalten Sie Identitätsattribute, die direkt Supabase zugeordnet sind.",
    profileSuccessTitle: "Ausführung Bestätigt",
    profileSavePending: "Änderung des 2FA-Status steht aus",
    profileErrorTitle: "Synchronisierungsfehler",
    labelFullName: "Vollständiger Name",
    labelAuthEmail: "Authentifizierungs-E-Mail",
    labelResetPassword: "Kontopasswort Zurücksetzen",
    placeholderPassword: "Neues Passwort zur Aktualisierung von Supabase eingeben",
    label2faTitle: "Zwei-Faktor-Synchronisierung (Google Authenticator)",
    label2faActiveDesc: "Die Multi-Faktor-Authentifizierung ist für diesen Shard derzeit aktiv.",
    label2faInactiveDesc: "Erzwingen Sie die Zwei-Faktor-Authentifizierung (MFA) via Google Authenticator.",
    btnSetup2fa: "2FA Einrichten",
    btnRevoke2fa: "2FA Deaktivieren",
    statusActive: "Aktiv",
    mfaStepScan: "1. Scannen Sie den QR-Code mit der Google Authenticator App.",
    mfaStepVerify: "2. Geben Sie den 6-stelligen Bestätigungscode unten ein.",
    labelVerifyCode: "Bestätigungscode",
    btnConfirmVerify: "Aktivierung Bestätigen",
    btnCancelVerify: "Einrichtung Abbrechen",
    btnApplyProfile: "Profil Aktualisieren",
    btnApplyingProfile: "Identitätsschicht wird synchronisiert...",
    revoking: "Wird deaktiviert..."
  },
  ja: {
    profileTitle: "ユーザープロファイルとセキュリティ設定",
    profileSubtitle: "Supabase認証インスタンスに直接マッピングされた個人設定を管理します。",
    profileSuccessTitle: "実行が確認されました",
    profileSavePending: "2FAステータス変更の保存待ちです",
    profileErrorTitle: "同期エラー",
    labelFullName: "氏名 / 管理者名",
    labelAuthEmail: "認証用メールアドレス",
    labelResetPassword: "パスワードの再設定",
    placeholderPassword: "Supabase認証を更新するための新しいパスワードを入力",
    label2faTitle: "二要素認証同期 (Google Authenticator)",
    label2faActiveDesc: "このワークスペースでは現在、多要素認証が有効になっています。",
    label2faInactiveDesc: "安全なアクセスのため、Google Authenticatorによる多要素認証（MFA）を強制します。",
    btnSetup2fa: "2FAの設定",
    btnRevoke2fa: "2FAの解除",
    statusActive: "有効",
    mfaStepScan: "1. Google AuthenticatorアプリでQRコードをスキャンします。",
    mfaStepVerify: "2. 同期を確認するため、以下の6桁の確認コードを入力してください。",
    labelVerifyCode: "確認コード",
    btnConfirmVerify: "有効化を確認",
    btnCancelVerify: "設定をキャンセル",
    btnApplyProfile: "認証情報の更新を保存",
    btnApplyingProfile: "IDレイヤーを同期中...",
    revoking: "解除中..."
  },
  zh: {
    profileTitle: "用户个人资料与安全描述符",
    profileSubtitle: "管理直接映射到 Supabase 身份验证实例的个人资料数据。",
    profileSuccessTitle: "执行已确认",
    profileSavePending: "2FA 状态更改正等待保存",
    profileErrorTitle: "同步故障",
    labelFullName: "管理员完整姓名",
    labelAuthEmail: "认证电子邮箱",
    labelResetPassword: "重置账户密码",
    placeholderPassword: "输入新密码以更新 Supabase 身份验证",
    label2faTitle: "双因子身份验证同步 (Google Authenticator)",
    label2faActiveDesc: "此工作空间分片当前已启用多因子验证。",
    label2faInactiveDesc: "通过 Google Authenticator 强制执行多因子身份验证 (MFA) 以确保安全访问。",
    btnSetup2fa: "配置 2FA",
    btnRevoke2fa: "撤销 2FA",
    statusActive: "已启用",
    mfaStepScan: "1. 使用 Google Authenticator 手机应用扫描二维码。",
    mfaStepVerify: "2. 在下方输入 6 位验证码以确认绑定同步。",
    labelVerifyCode: "验证码",
    btnConfirmVerify: "确认激活",
    btnCancelVerify: "取消配置",
    btnApplyProfile: "保存个人资料更改",
    btnApplyingProfile: "正在同步身份验证层...",
    revoking: "正在撤销..."
  }
};

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
  const [lang, setLang] = useState<keyof typeof translations>("id");

  // MFA Setup State
  const [mfaStep, setMfaStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle');
  const [mfaData, setMfaData] = useState<{ qrCode?: string; secret?: string; factorId?: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isMfaPending, setIsMfaPending] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
    if (translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const t = translations[lang] || translations.id;

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
            <Shield className="w-4 h-4 text-indigo-500" /> {t.profileTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.profileSubtitle}
          </p>
        </div>

        {(message || (enable2fa && !initial2fa) || (!enable2fa && initial2fa)) && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-sm flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-bounce-once">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.profileSuccessTitle}</p>
              <p>{message || t.profileSavePending}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-sm flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300 animate-shake-soft">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{t.profileErrorTitle}</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.labelFullName}
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
              {t.labelAuthEmail}
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
            {t.labelResetPassword}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type="password"
              name="password"
              placeholder={t.placeholderPassword}
              className="w-full h-[34px] pl-9 pr-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/50 dark:bg-[#0b0f19]/50 border border-slate-100 dark:border-slate-800 rounded-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {t.label2faTitle}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {enable2fa 
                  ? t.label2faActiveDesc 
                  : t.label2faInactiveDesc}
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
                {t.btnSetup2fa}
              </button>
            )}
            {enable2fa && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-sm text-[9px] font-black uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3" /> {t.statusActive}
                </div>
                <button
                  type="button"
                  onClick={handleRevoke2fa}
                  disabled={isMfaPending}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isMfaPending ? t.revoking : t.btnRevoke2fa}
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
                    {t.mfaStepScan}<br/>
                    {t.mfaStepVerify}
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">{t.labelVerifyCode}</label>
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
                        {isMfaPending ? "Verifying..." : t.btnConfirmVerify}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setMfaStep('idle')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    {t.btnCancelVerify}
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
            <span>{isPending ? t.btnApplyingProfile : t.btnApplyProfile}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
