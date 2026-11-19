"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TICKET_CATEGORIES, type TicketCategory } from "@/lib/support";
import { createTicket } from "./actions";
import { AttachImage } from "./thread";

/** "Laporan baru": category, title, description, optional screenshot. */
export function NewTicketDialog({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await createTicket({
        storeId,
        category,
        subject,
        message,
        image,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Laporan terkirim. Admin akan membalas di sini.");
      setOpen(false);
      setSubject("");
      setMessage("");
      setImage(null);
      router.push(`/${storeId}/support/${res.data!.id}`);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LifeBuoy /> Laporan baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Laporkan masalah / minta bantuan</DialogTitle>
          <DialogDescription>
            Ceritakan apa yang terjadi dan langkah untuk mengulanginya.
            Screenshot sangat membantu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Kategori</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TicketCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-subject">Judul</Label>
            <Input
              id="t-subject"
              maxLength={120}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Tombol upgrade paket error"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-message">Deskripsi</Label>
            <Textarea
              id="t-message"
              rows={5}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Saat klik Upgrade ke Pro muncul pesan…"
            />
          </div>
          <AttachImage value={image} onChange={setImage} />
        </div>
        {(subject.trim().length < 3 || message.trim().length < 10) && (
          <p className="text-muted-foreground text-xs">
            Isi judul minimal 3 karakter dan deskripsi minimal 10 karakter
            {message.trim().length < 10 && message.trim().length > 0 ? ` (deskripsi baru ${message.trim().length})` : ""}.
          </p>
        )}
        <DialogFooter>
          <Button
            disabled={
              pending || subject.trim().length < 3 || message.trim().length < 10
            }
            onClick={submit}
          >
            {pending && <Loader2 className="animate-spin" />} Kirim laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
