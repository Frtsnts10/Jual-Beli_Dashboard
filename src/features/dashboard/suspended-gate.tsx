"use client";

import { usePathname } from "next/navigation";

/**
 * A suspended store's pages stay visible but nothing on them can be clicked or typed into
 * (`inert`), except Bantuan, where the seller can talk to the platform admin.
 */
export function SuspendedGate({ suspended, children }: { suspended: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  if (!suspended || /\/support(\/|$)/.test(pathname)) return <>{children}</>;
  return (
    <div inert aria-disabled className="pointer-events-none select-none opacity-50">
      {children}
    </div>
  );
}
