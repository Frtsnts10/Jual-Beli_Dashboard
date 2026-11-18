import { redirect } from "next/navigation";
import { getAccessibleStores, requireUser } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";

export default async function DashboardIndex() {
  const user = await requireUser();
  // Admin accounts land on the admin panel; sellers on their store (or store creation).
  if (await isPlatformAdmin()) redirect("/platform");
  const stores = await getAccessibleStores(user.uid);
  redirect(stores.length ? `/${stores[0].id}` : "/onboarding");
}
