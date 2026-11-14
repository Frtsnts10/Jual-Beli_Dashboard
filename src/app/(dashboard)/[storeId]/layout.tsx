import { ExternalLink } from "lucide-react";
import { getOwnedStores, requireStore } from "@/lib/auth";
import { countOpenClaims } from "@/lib/queries";
import { storefrontUrl } from "@/lib/store-url";
import { TIERS } from "@/config/tiers";
import { SidebarNav } from "@/features/dashboard/sidebar-nav";
import { StoreSwitcher } from "@/features/stores/store-switcher";
import { UserMenu } from "@/features/auth/user-menu";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user, store } = await requireStore(storeId);
  const [stores, openClaims] = await Promise.all([getOwnedStores(user.uid), countOpenClaims(storeId)]);
  const switcherStores = stores.map((s) => ({ id: s.id, store_name: s.store_name }));

  return (
    <div className="flex min-h-svh">
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col gap-4 border-r p-4 md:flex">
        <StoreSwitcher stores={switcherStores} currentId={storeId} />
        <SidebarNav storeId={storeId} openClaims={openClaims} className="flex-col" />
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
            <UserMenu name={user.full_name} email={user.email} tier={TIERS[user.subscription_tier].name} />
          </div>
        </header>
        <SidebarNav storeId={storeId} openClaims={openClaims} className="overflow-x-auto border-b px-2 py-1 md:hidden" />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
