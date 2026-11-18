import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedStores, requireUser } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { TIERS } from "@/config/tiers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateStoreForm } from "@/features/stores/create-store-form";

export const metadata = { title: "Buat toko" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (await isPlatformAdmin()) redirect("/platform"); // admin accounts don't open stores
  const stores = await getOwnedStores(user.uid);
  const tier = TIERS[user.subscription_tier];
  const atLimit = stores.length >= tier.maxStores;

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{stores.length ? "Tambah toko baru" : "Buat toko pertama Anda"}</CardTitle>
          <CardDescription>
            Paket {tier.name}: {stores.length}/{Number.isFinite(tier.maxStores) ? tier.maxStores : "∞"} toko terpakai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atLimit ? (
            <p className="text-sm">Batas toko paket Anda sudah tercapai. Upgrade paket untuk menambah toko.</p>
          ) : (
            <CreateStoreForm rootDomain={process.env.NEXT_PUBLIC_ROOT_DOMAIN} />
          )}
          {stores.length > 0 && (
            <Link href={`/${stores[0].id}`} className="text-muted-foreground mt-4 block text-center text-sm hover:underline">
              Kembali ke dashboard
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
