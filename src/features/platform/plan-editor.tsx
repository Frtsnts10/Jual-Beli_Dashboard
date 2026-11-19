"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubscriptionTier } from "@/types/schema";
import { setUserPlan } from "./actions";

export function PlanEditor({ uid, tier, plans }: { uid: string; tier: SubscriptionTier; plans: { key: SubscriptionTier; name: string }[] }) {
  const [value, setValue] = useState<SubscriptionTier>(tier);
  const [days, setDays] = useState(30);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-2">
      <Select value={value} onValueChange={(v) => setValue(v as SubscriptionTier)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {plans.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== "starter" && <Input type="number" className="w-20" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Hari" />}
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setUserPlan(uid, value, days);
            if (res.ok) toast.success("Paket diperbarui");
            else toast.error(res.error);
          })
        }
      >
        Simpan
      </Button>
    </div>
  );
}
