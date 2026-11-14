import { ExternalLink } from "lucide-react";
import { getAccessibleStores, requireStore } from "@/lib/auth";
import { countOpenClaims } from "@/lib/queries";
import { storefrontUrl } from "@/lib/store-url";
import { TIERS } from "@/config/tiers";
import { SidebarNav } from "@/features/dashboard/sidebar-nav";
import { StoreSwitcher } from "@/features/stores/store-switcher";
import { UserMenu } from "@/features/auth/user-menu";
import { isPlatformAdmin } from "@/lib/platform";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user, store, role } = await requireStore(storeId);
  const [stores, openClaims] = await Promise.all([getAccessibleStores(user.uid), countOpenClaims(storeId)]);
  const switcherStores = stores.map((s) => ({ id: s.id, store_name: s.store_name }));

  return (
    <div className="flex min-h-svh">
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col gap-4 border-r p-4 md:flex">
        <StoreSwitcher stores={switcherStores} currentId={storeId} />
        <SidebarNav storeId={storeId} openClaims={openClaims} isOwner={role === "owner"} className="flex-col" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <div className="w-48 md:hidden">
            <StoreSwitcher stores={switcherStores} currentId={storeId} />
          </div>
          <a
            href={storefrontUrl(store)}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground hidden items-center gap-1 text-sm md:flex"
          >
            Lihat toko <ExternalLink className="size-3.5" />
          </a>
          <div className="ml-auto">
            <UserMenu name={user.full_name} email={user.email} tier={TIERS[user.subscription_tier].name} platformAdmin={await isPlatformAdmin()} />
          </div>
        </header>
        <SidebarNav storeId={storeId} openClaims={openClaims} isOwner={role === "owner"} className="overflow-x-auto border-b px-2 py-1 md:hidden" />
        {store.suspended && (
          <div className="bg-destructive/10 text-destructive border-b px-6 py-2 text-sm">
            Toko ini disuspend oleh admin platform — etalase dan checkout ditutup. Hubungi support platform.
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
