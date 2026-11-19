"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reauthenticate } from "@/features/auth/reauth";
import { resetAllData } from "./reset-actions";

const PHRASE = "RESET SEMUA DATA";

/** Admin → Ringkasan: the button that empties the platform (admins and platform settings stay). */
export function ResetDataCard({ email, verifyWith }: { email: string; verifyWith: "password" | "google" }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const ready = phrase.trim() === PHRASE && (verifyWith === "google" || password.length > 0);

  return (
    <Card className="border-destructive/50 mt-6">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" /> Zona berbahaya: reset semua data
        </CardTitle>
        <CardDescription>Mengosongkan platform, misalnya setelah uji coba. Tidak bisa dibatalkan.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-destructive/5 rounded-lg p-4">
            <p className="font-medium">Dihapus selamanya</p>
            <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
              <li>Semua penjual, toko, produk dan stok brankas</li>
              <li>Semua pesanan, bukti bayar, pelanggan, voucher, ulasan</li>
              <li>Pembayaran paket, laporan bantuan, pengumuman, notifikasi</li>
              <li>Semua login selain admin, gambar dan file unggahan</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Tetap ada</p>
            <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
              <li>Akun admin platform (PLATFORM_ADMIN_EMAILS)</li>
              <li>QRIS platform, paket, tema dan pengaturan Tema AI</li>
              <li>Log audit admin</li>
            </ul>
          </div>
        </div>
        {!armed ? (
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-fit" onClick={() => setArmed(true)}>
            <RotateCcw /> Reset data…
          </Button>
        ) : (
          <div className="grid max-w-md gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-phrase">
                Ketik <b>{PHRASE}</b>
              </Label>
              <Input id="reset-phrase" autoComplete="off" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
            </div>
            {verifyWith === "password" ? (
              <div className="grid gap-2">
                <Label htmlFor="reset-password">Password admin ({email})</Label>
                <Input id="reset-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Anda akan diminta masuk dengan Google sekali lagi.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" disabled={pending} onClick={() => setArmed(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={!ready || pending}
                onClick={() =>
                  start(async () => {
                    const idToken = await reauthenticate(verifyWith, email, password);
                    if (!idToken) return;
                    const res = await resetAllData({ phrase, idToken });
                    if (!res.ok) return void toast.error(res.error);
                    const s = res.data!;
                    toast.success(`Data direset: ${s.users} login, ${s.collections} koleksi dan ${s.files} file dihapus.`);
                    setArmed(false);
                    setPhrase("");
                    setPassword("");
                    router.refresh();
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} {pending ? "Mereset…" : "Reset semua data"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
