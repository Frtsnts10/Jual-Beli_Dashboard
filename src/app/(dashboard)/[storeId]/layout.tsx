import { ExternalLink } from "lucide-react";
import { getAccessibleStores, requireStore } from "@/lib/access/auth";
import { countAwaitingConfirmation, countOpenClaims } from "@/lib/data/queries";
import { storefrontUrl } from "@/lib/store-url";
import { getCatalog } from "@/lib/catalog";
import { SidebarNav } from "@/features/dashboard/sidebar-nav";
import { StoreSwitcher } from "@/features/stores/store-switcher";
import { UserMenu } from "@/features/auth/user-menu";
import { isPlatformAdmin } from "@/lib/access/platform";
import {
  activeAnnouncements,
  listNotifications,
} from "@/lib/data/notifications";
import { countUserUnreadTickets } from "@/lib/data/support";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { AnnouncementBar } from "@/features/notifications/announcement-bar";
import { LiveRefresh } from "@/features/dashboard/live-refresh";
import { Brand } from "@/components/brand";
import { isDemoSession } from "@/lib/access/demo";
import Link from "next/link";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { user, store, role } = await requireStore(storeId);
  const [stores, claims, awaiting, notes, announcements, supportUnread] =
    await Promise.all([
      getAccessibleStores(user.uid),
      countOpenClaims(storeId),
      countAwaitingConfirmation(storeId),
      listNotifications(user.uid),
      activeAnnouncements(user.subscription_tier),
      countUserUnreadTickets(user.uid),
    ]);
  // Pesanan badge: warranty claims + QRIS payments waiting for the seller's confirmation.
  const openClaims = claims + awaiting;
  const switcherStores = stores.map((s) => ({
    id: s.id,
    store_name: s.store_name,
  }));

  return (
    <div className="flex h-svh overflow-hidden">
      <LiveRefresh storeId={storeId} />
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r p-4 lg:flex">
        <Brand className="px-1" />
        <StoreSwitcher stores={switcherStores} currentId={storeId} />
        <SidebarNav
          storeId={storeId}
          openClaims={openClaims}
          isOwner={role === "owner"}
          supportUnread={supportUnread}
          className="flex-col"
        />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <div className="w-44 min-w-0 sm:w-56 lg:hidden">
            <StoreSwitcher stores={switcherStores} currentId={storeId} />
          </div>
          <a
            href={storefrontUrl(store)}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground hidden items-center gap-1 text-sm whitespace-nowrap sm:flex"
          >
            Lihat toko <ExternalLink className="size-3.5" />
          </a>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell items={notes.items} unread={notes.unread} />
            <UserMenu
              name={user.full_name}
              email={user.email}
              tier={(await getCatalog()).plans[user.subscription_tier].name}
              platformAdmin={await isPlatformAdmin()}
            />
          </div>
        </header>
        <SidebarNav
          storeId={storeId}
          openClaims={openClaims}
          isOwner={role === "owner"}
          supportUnread={supportUnread}
          className="shrink-0 overflow-x-auto border-b px-2 py-1 lg:hidden"
        />
        {(await isDemoSession()) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-sky-50 px-6 py-2 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            <span>
              <b>Mode demo</b> — Anda melihat toko contoh. Semua halaman bisa dibuka, tapi perubahan tidak disimpan.
            </span>
            <Link href="/sign-up" className="font-medium underline underline-offset-4">
              Buat toko sendiri, gratis
            </Link>
          </div>
        )}
        <AnnouncementBar items={announcements} />
        {store.suspended && (
          <div className="bg-destructive/10 text-destructive border-b px-6 py-2 text-sm">
            Toko ini disuspend oleh admin platform — etalase dan checkout
            ditutup. Hubungi support platform.
          </div>
        )}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
