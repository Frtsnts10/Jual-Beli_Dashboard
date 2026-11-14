"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { connectXendit, refreshXenditStatus } from "./payment-actions";

const STATUS_TEXT: Record<string, string> = {
  INVITED: "Undangan terkirim — cek email dari Xendit untuk mengaktifkan akun.",
  REGISTERED: "Akun terdaftar — lengkapi verifikasi (KYC) di dashboard Xendit.",
  AWAITING_DOCS: "Menunggu dokumen verifikasi di dashboard Xendit.",
  LIVE: "Aktif. Pembayaran pembeli masuk langsung ke akun Xendit Anda.",
  SUSPENDED: "Akun Xendit ditangguhkan. Hubungi Xendit.",
};

export function PaymentCard({ storeId, status, feePercent }: { storeId: string; status: string | null; feePercent: number }) {
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
        <CardTitle className="flex items-center gap-2">
          Pencairan dana (Xendit) {status && <Badge variant={status === "LIVE" ? "success" : "warning"}>{status}</Badge>}
        </CardTitle>
        <CardDescription>
          Hubungkan akun Xendit agar uang pembeli masuk langsung ke Anda. Fee platform {feePercent}% dipotong otomatis (split payment).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        {status ? STATUS_TEXT[status] ?? status : "Belum terhubung. Sampai terhubung, pembayaran ditampung platform lalu dicairkan ke Anda."}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        {status ? (
          status !== "LIVE" && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => refreshXenditStatus(storeId), "Status diperbarui")}>
              Cek status
            </Button>
          )
        ) : (
          <Button disabled={pending} onClick={() => run(() => connectXendit(storeId), "Undangan Xendit dikirim ke email Anda")}>
            Hubungkan Xendit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
