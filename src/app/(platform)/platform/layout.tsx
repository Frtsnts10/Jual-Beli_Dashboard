import Link from "next/link";
import { Shield } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/access/platform";

export const metadata = { title: { template: "%s · Platform", default: "Platform" }, robots: { index: false } };

const NAV = [
  { href: "/platform", label: "Ringkasan" },
  { href: "/platform/stores", label: "Toko" },
  { href: "/platform/users", label: "Pengguna" },
  { href: "/platform/payouts", label: "Pencairan" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div className="min-h-svh">
      <header className="flex h-14 items-center gap-6 border-b px-6">
        <span className="flex items-center gap-2 font-semibold">
          <Shield className="size-4" /> Admin Platform
        </span>
        <nav className="flex gap-4 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-muted-foreground hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="text-muted-foreground ml-auto text-sm hover:underline">
          Ke dashboard toko →
        </Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
