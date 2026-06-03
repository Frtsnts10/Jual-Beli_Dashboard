import React from "react";
import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { adminDb } from "@/lib/firebase/server";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";

export default async function TenantInventoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [storeDoc, items, subscription] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    getInventoryAction(storeId),
    getSubscriptionStatus(storeId),
  ]);

  const currency = storeDoc.data()?.currency || "IDR";

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div className="pt-2">
        <InventoryTable 
          storeId={storeId} 
          items={items} 
          currency={currency} 
          isPremium={subscription.isSubscribed}
        />
      </div>
    </div>
  );
}
