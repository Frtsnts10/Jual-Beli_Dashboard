"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendBroadcast } from "./actions";

export function BroadcastForm({ storeId, products }: { storeId: string; products: { id: string; title: string }[] }) {
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm("Kirim broadcast ke semua penerima terpilih?")) return;
        start(async () => {
          const res = await sendBroadcast(storeId, { message, productId: audience === "all" ? null : audience });
          if (!res.ok) return void toast.error(res.error);
          toast.success(`Broadcast dikirim ke ${res.data?.recipients} pembeli`);
          setMessage("");
        });
      }}
    >
      <div className="grid gap-2">
        <Label>Penerima</Label>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua pembeli</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                Pembeli {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Pesan</Label>
        <Textarea
          id="message"
          rows={5}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Promo spesial dari {store}! Diskon 20% semua akun hari ini saja…"
        />
        <p className="text-muted-foreground text-xs">Variabel: {"{store}"}. Maksimal 1 broadcast per jam.</p>
      </div>
      <Button type="submit" disabled={pending || message.trim().length < 10} className="w-fit">
        <Send /> {pending ? "Mengirim…" : "Kirim broadcast"}
      </Button>
    </form>
  );
}
