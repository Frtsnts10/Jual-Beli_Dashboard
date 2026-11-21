"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton, OrDivider } from "@/features/auth/google-button";
import { authErrorMessage, startSession } from "@/features/auth/start-session";

function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const deleted = params.get("deleted") === "1";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, String(form.get("email")), String(form.get("password")));
      await startSession(cred, undefined, next);
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>Kelola toko, produk dan pesanan Anda.</CardDescription>
      </CardHeader>
      <CardContent>
          {deleted && <p className="bg-muted mb-4 rounded-md p-3 text-sm">Akun Anda dan seluruh datanya sudah dihapus.</p>}
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-muted-foreground text-xs hover:underline">
                Lupa password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses…" : "Masuk"}
          </Button>
          <OrDivider />
          <GoogleButton next={next} disabled={pending} onError={setError} />
          <Button variant="secondary" asChild>
            <Link href="/demo">Coba demo tanpa daftar</Link>
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Belum punya akun?{" "}
            <Link href="/sign-up" className="text-foreground underline underline-offset-4">
              Daftar gratis
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
