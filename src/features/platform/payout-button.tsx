"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { markPayoutDone } from "./actions";

export function PayoutButton({ storeId, orderIds, net }: { storeId: string; orderIds: string[]; net: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => {
        const reference = prompt(`Sudah transfer ${formatIDR(net)}? Isi nomor/ref bukti transfer:`);
        if (!reference) return;
        start(async () => {
          const res = await markPayoutDone(storeId, orderIds, reference);
          if (res.ok) toast.success(`Pencairan ${formatIDR(res.data!.amount)} dicatat`);
          else toast.error(res.error);
        });
      }}
    >
      Tandai sudah ditransfer
    </Button>
  );
}
