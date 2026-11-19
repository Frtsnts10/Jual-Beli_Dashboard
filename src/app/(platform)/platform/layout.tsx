import { Brand } from "@/components/brand";
import { requirePlatformAdmin } from "@/lib/access/platform";
import { listNotifications } from "@/lib/data/notifications";
import { countNewTickets } from "@/lib/data/support";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { UserMenu } from "@/features/auth/user-menu";
import { PlatformNav } from "@/features/platform/platform-nav";

export const metadata = {
  title: { template: "%s · Jual Admin", default: "Jual Admin" },
  robots: { index: false },
};

const NAV = [
  { href: "/platform", label: "Ringkasan" },
  { href: "/platform/stores", label: "Toko" },
  { href: "/platform/users", label: "Pengguna" },
  { href: "/platform/payments", label: "Pembayaran paket" },
  { href: "/platform/plans", label: "Paket" },
  { href: "/platform/themes", label: "Tema" },
  { href: "/platform/support", label: "Bantuan" },
  { href: "/platform/announcements", label: "Pengumuman" },
  { href: "/platform/deletions", label: "Hapus akun" },
];

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();
  const [notes, newTickets] = await Promise.all([
    listNotifications(admin.uid),
    countNewTickets(),
  ]);
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Phone/tablet: title + bell/account on one row, the section links scroll underneath. */}
      <header className="bg-background flex shrink-0 flex-wrap items-center gap-x-6 border-b px-4 md:h-14 md:flex-nowrap md:px-6">
        {/* Desktop: brand and account take equal side columns so the links sit in the middle. */}
        <div className="flex h-12 items-center md:h-auto md:flex-1 md:basis-0">
          <Brand suffix="Admin" />
        </div>
        <div className="ml-auto flex items-center gap-2 md:order-last md:ml-0 md:flex-1 md:basis-0 md:justify-end">
          <NotificationBell items={notes.items} unread={notes.unread} />
          <UserMenu name={admin.full_name} email={admin.email} adminAccount />
        </div>
        <PlatformNav items={NAV} newTickets={newTickets} />
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 [&_[data-slot=badge]]:rounded-full">{children}</main>
    </div>
  );
}
