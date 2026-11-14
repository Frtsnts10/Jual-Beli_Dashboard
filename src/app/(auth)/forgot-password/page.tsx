"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/features/auth/start-session";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, String(new FormData(e.currentTarget).get("email")));
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>Kami kirim link reset ke email Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm">Jika email terdaftar, link reset sudah dikirim. Cek inbox/spam Anda.</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={pending}>
              Kirim link reset
            </Button>
          </form>
        )}
        <Link href="/sign-in" className="text-muted-foreground mt-4 block text-center text-sm hover:underline">
          Kembali ke login
        </Link>
      </CardContent>
    </Card>
  );
}
