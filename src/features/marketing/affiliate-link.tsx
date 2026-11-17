"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AffiliateLinkBuilder({ baseUrl }: { baseUrl: string }) {
  const [ref, setRef] = useState("");
  const clean = ref.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  const link = clean.length >= 2 ? `${baseUrl}?ref=${clean}` : "";
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="username reseller, mis. budi_reseller" />
        <Button
          type="button"
          variant="outline"
          disabled={!link}
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            toast.success("Link disalin");
          }}
        >
          <Copy /> Salin
        </Button>
      </div>
      {link && <code className="bg-muted rounded-md px-2 py-1 text-xs break-all">{link}</code>}
    </div>
  );
}
