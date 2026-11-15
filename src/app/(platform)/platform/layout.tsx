import Link from "next/link";
import { Shield } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/access/platform";

export const metadata = { title: { template: "%s · Platform", default: "Platform" }, robots: { index: false } };

const NAV = [
  { href: "/platform", label: "Ringkasan" },
  { href: "/platform/stores", label: "Toko" },
  { href: "/platform/users", label: "Pengguna" },
];

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div className="min-h-svh">
      {/* Phone/tablet: title + "to dashboard" on one row, the section links scroll underneath. */}
      <header className="flex flex-wrap items-center gap-x-6 border-b px-4 md:h-14 md:flex-nowrap md:px-6">
        <span className="flex h-12 items-center gap-2 font-semibold whitespace-nowrap md:h-auto">
          <Shield className="size-4" /> Admin Platform
        </span>
        <Link href="/dashboard" className="text-muted-foreground ml-auto text-sm whitespace-nowrap hover:underline md:order-last">
          Ke dashboard toko →
        </Link>
        <nav className="-mx-4 flex w-[calc(100%+2rem)] gap-4 overflow-x-auto border-t px-4 py-2 text-sm md:mx-0 md:w-auto md:border-0 md:p-0">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
