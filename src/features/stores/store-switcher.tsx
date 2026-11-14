"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreSwitcher({ stores, currentId }: { stores: { id: string; store_name: string }[]; currentId: string }) {
  const router = useRouter();
  const current = stores.find((s) => s.id === currentId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">{current?.store_name ?? "Pilih toko"}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Toko Anda</DropdownMenuLabel>
        {stores.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => router.push(`/${s.id}`)}>
            <span className="truncate">{s.store_name}</span>
            {s.id === currentId && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding">
            <Plus /> Tambah toko
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
