"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { createAnnouncement, endAnnouncement } from "./actions";

const TIERS = [
  ["starter", "Starter"],
  ["pro", "Pro"],
  ["ultimate", "Ultimate"],
] as const;

/** Admin: write a banner + notification for all users or selected plans. */
export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<"info" | "warning" | "maintenance">(
    "info",
  );
  const [all, setAll] = useState(true);
  const [tiers, setTiers] = useState<string[]>([]);
  const [endsAt, setEndsAt] = useState("");
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await createAnnouncement({
        title,
        body,
        level,
        tiers: all ? null : tiers,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(
        `Pengumuman terbit · ${res.data!.notified} pengguna dikirimi notifikasi`,
      );
      setTitle("");
      setBody("");
      setEndsAt("");
      router.refresh();
    });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="a-title">Judul</Label>
          <Input
            id="a-title"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Maintenance Minggu 02.00–04.00"
          />
        </div>
        <div className="grid gap-2">
          <Label>Jenis</Label>
          <Select
            value={level}
            onValueChange={(v) => setLevel(v as typeof level)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Penting</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="a-body">Isi</Label>
        <Textarea
          id="a-body"
          rows={3}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Untuk</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={all ? "default" : "outline"}
              onClick={() => setAll(true)}
            >
              Semua pengguna
            </Button>
            {TIERS.map(([k, label]) => {
              const on = !all && tiers.includes(k);
              return (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant={on ? "default" : "outline"}
                  onClick={() => {
                    setAll(false);
                    setTiers((t) =>
                      t.includes(k) ? t.filter((x) => x !== k) : [...t, k],
                    );
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="a-ends">Tampil sampai (opsional)</Label>
          <Input
            id="a-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Button disabled={pending || title.trim().length < 3} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : <Megaphone />}{" "}
          Terbitkan
        </Button>
      </div>
    </div>
  );
}

export function EndAnnouncementButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await endAnnouncement(id);
          if (!res.ok) return void toast.error(res.error);
          router.refresh();
        })
      }
    >
      Akhiri
    </Button>
  );
}
