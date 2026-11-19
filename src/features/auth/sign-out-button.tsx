"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

/** Ends the session cookie and the client login, then reloads to the sign-in page. */
export async function signOutEverywhere() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(auth).catch(() => {});
  // Full reload so no signed-in client state survives sign-out.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/sign-in";
}

export function SignOutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOutEverywhere();
      }}
    >
      <LogOut /> Keluar
    </Button>
  );
}
