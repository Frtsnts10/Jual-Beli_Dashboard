"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Shield, Trash2, User } from "lucide-react";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { signOutEverywhere } from "./sign-out-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Account menu. Sellers see their plan; a platform admin account (`adminAccount`) has no plan
 * or store — it shows its role instead.
 */
export function UserMenu({
  name,
  email,
  tier,
  platformAdmin = false,
  adminAccount = false,
}: {
  name: string;
  email: string;
  tier?: string;
  platformAdmin?: boolean;
  adminAccount?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Akun">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="truncate">{name || email}</div>
          <div className="text-muted-foreground truncate text-xs font-normal">{email}</div>
          <div className="text-muted-foreground mt-1 text-xs font-normal">{adminAccount ? "Peran: Admin platform" : `Paket: ${tier}`}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {platformAdmin && !adminAccount && (
          <DropdownMenuItem asChild>
            <Link href="/platform">
              <Shield /> Admin platform
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => void signOutEverywhere()}
        >
          <LogOut /> Keluar
        </DropdownMenuItem>
        {!adminAccount && !platformAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive [&_svg]:text-destructive" onSelect={() => setDeleting(true)}>
              <Trash2 /> Hapus akun
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />
    </>
  );
}
