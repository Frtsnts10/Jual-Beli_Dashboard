"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/features/auth/google-button";
import { authErrorMessage, startSession } from "@/features/auth/start-session";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("full_name")).trim();
    setPending(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, String(form.get("email")), String(form.get("password")));
      await updateProfile(cred.user, { displayName: fullName });
      // Needed before team invitations sent to this address can be accepted.
      await sendEmailVerification(cred.user).catch(() => {});
      await startSession(cred, fullName, "/onboarding");
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Buat akun</CardTitle>
        <CardDescription>Mulai gratis dengan paket Starter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nama lengkap</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={6} autoComplete="new-password" required />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses…" : "Daftar"}
          </Button>
          <GoogleButton next="/onboarding" disabled={pending} onError={setError} />
          <p className="text-muted-foreground text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-4">
              Masuk
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
