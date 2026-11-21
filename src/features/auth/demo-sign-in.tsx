"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoLoader } from "@/components/logo-loader";
import { startSession } from "./start-session";

/** Signs in as the demo seller (custom token from /api/auth/demo) and opens the dashboard. */
export function DemoSignIn() {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error ?? "Demo tidak tersedia saat ini.");
      await startSession(await signInWithCustomToken(auth, data.token), undefined, "/dashboard");
    })().catch((err: Error) => setError(err.message || "Demo tidak tersedia saat ini."));
  }, []);

  if (!error) return <LogoLoader label="Membuka toko demo…" />;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo belum bisa dibuka</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button asChild>
          <Link href="/sign-up">Daftar gratis</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/sign-in">Masuk</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
