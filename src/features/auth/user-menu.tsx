"use client";

import { signOut } from "firebase/auth";
import { LogOut, User } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ name, email, tier }: { name: string; email: string; tier: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Akun">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="truncate">{name || email}</div>
          <div className="text-muted-foreground truncate text-xs font-normal">{email}</div>
          <div className="text-muted-foreground mt-1 text-xs font-normal">Paket: {tier}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await fetch("/api/auth/session", { method: "DELETE" });
            await signOut(auth).catch(() => {});
            // Full reload so no signed-in client state survives sign-out.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/sign-in";
          }}
        >
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
