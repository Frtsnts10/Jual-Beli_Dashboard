import { redirect } from "next/navigation";
import { getOwnedStores, requireUser } from "@/lib/auth";

export default async function DashboardIndex() {
  const user = await requireUser();
  const stores = await getOwnedStores(user.uid);
  redirect(stores.length ? `/${stores[0].id}` : "/onboarding");
}
