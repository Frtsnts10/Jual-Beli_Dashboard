"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncStoreAuthDomains } from "./auth-domain-actions";

export function SyncAuthDomainsButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await syncStoreAuthDomains();
          if (!res.ok) return void toast.error(res.error);
          toast.success(`${res.data!.hosts} domain toko terdaftar untuk login Google`);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sinkronkan domain toko
    </Button>
  );
}
