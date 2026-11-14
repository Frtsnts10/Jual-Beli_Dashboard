"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setStoreSuspended } from "./actions";

export function SuspendButton({ storeId, suspended }: { storeId: string; suspended: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={suspended ? "outline" : "destructive"}
      disabled={pending}
      onClick={() => {
        const reason = suspended ? "" : prompt("Alasan suspend (dicatat di audit log):") ?? "";
        if (!suspended && !reason) return;
        start(async () => {
          const res = await setStoreSuspended(storeId, !suspended, reason);
          if (res.ok) toast.success(suspended ? "Toko diaktifkan lagi" : "Toko disuspend");
          else toast.error(res.error);
        });
      }}
    >
      {suspended ? "Aktifkan" : "Suspend"}
    </Button>
  );
}
