"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlan } from "./catalog-actions";

/** Admin → Paket: adds a paid plan (starts from Pro's contents, then edited on its card). */
export function AddPlanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await createPlan(name);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Paket ${name.trim()} dibuat — atur harga dan isinya di kartunya.`);
      setOpen(false);
      setName("");
      router.refresh();
      setTimeout(() => document.getElementById(`plan-${res.data!.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Tambah paket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paket baru</DialogTitle>
          <DialogDescription>Isinya disalin dari paket Pro; harga, batas, template dan fitur bisa diubah setelah dibuat.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Label htmlFor="new-plan-name">Nama paket</Label>
          <Input id="new-plan-name" autoFocus maxLength={30} placeholder="mis. Business" value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              Buat paket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
