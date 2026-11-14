"use client";

import { useState, useTransition } from "react";
import { Lock, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cancelInvite, inviteAdmin, removeAdmin } from "./actions";

export function TeamCard({
  storeId,
  ownerEmail,
  allowed,
  members,
  invites,
}: {
  storeId: string;
  ownerEmail: string;
  allowed: boolean;
  members: { uid: string; email: string }[];
  invites: { id: string; email: string }[];
}) {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(ok);
      else toast.error(res.error);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Tim admin {!allowed && <Lock className="size-4" />}</CardTitle>
        <CardDescription>
          Admin bisa mengelola produk, stok, pesanan, marketing dan tampilan toko. Langganan, pencairan dana, domain dan tim hanya untuk pemilik.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span>{ownerEmail}</span>
            <Badge>Pemilik</Badge>
          </div>
          {members.map((m) => (
            <div key={m.uid} className="flex items-center justify-between">
              <span>{m.email}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Admin</Badge>
                <Button variant="ghost" size="icon" aria-label="Hapus admin" disabled={pending} onClick={() => confirm(`Cabut akses ${m.email}?`) && run(() => removeAdmin(storeId, m.uid), "Akses dicabut")}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          {invites.map((i) => (
            <div key={i.id} className="flex items-center justify-between">
              <span className="text-muted-foreground">{i.email}</span>
              <div className="flex items-center gap-2">
                <Badge variant="warning">Menunggu daftar</Badge>
                <Button variant="ghost" size="icon" aria-label="Batalkan undangan" disabled={pending} onClick={() => run(() => cancelInvite(storeId, i.id), "Undangan dibatalkan")}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {allowed ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await inviteAdmin(storeId, email);
                if (!res.ok) return void toast.error(res.error);
                toast.success(res.data?.pending ? "Undangan dibuat — akses aktif saat orang ini mendaftar dengan email tersebut." : "Admin ditambahkan");
                setEmail("");
              });
            }}
          >
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email admin" required />
            <Button type="submit" disabled={pending}>
              <UserPlus /> Undang
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground">Multi-user admin tersedia di paket Ultimate.</p>
        )}
      </CardContent>
    </Card>
  );
}
