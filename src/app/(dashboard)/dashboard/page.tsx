import { redirect } from "next/navigation";
import { getAccessibleStores, requireUser } from "@/lib/auth";

export default async function DashboardIndex() {
  const user = await requireUser();
  const stores = await getAccessibleStores(user.uid);
  redirect(stores.length ? `/${stores[0].id}` : "/onboarding");
}
