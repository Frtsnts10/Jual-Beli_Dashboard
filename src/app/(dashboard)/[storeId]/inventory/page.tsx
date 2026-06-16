import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory",
};


import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { InventoryTable } from "@/features/inventory/components/inventory-table";
import { adminDb } from "@/lib/firebase/server";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";
import { getDigitalAccountsAction } from "@/features/digital-accounts/actions/import-export-actions";
import { InventoryTabs } from "@/features/inventory/components/inventory-tabs";

export default async function TenantInventoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [storeDoc, items, subscription, digitalAccountsRes] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    getInventoryAction(storeId),
    getSubscriptionStatus(storeId),
    getDigitalAccountsAction(storeId)
  ]);

  const currency = storeDoc.data()?.currency || "IDR";
  const digitalAccounts = digitalAccountsRes.accounts || [];

  return (
    <div className="space-y-6 font-sans transition-colors pb-12">
      <InventoryTabs 
        storeId={storeId}
        digitalAccounts={digitalAccounts}
        inventoryTableComponent={
          <InventoryTable 
            storeId={storeId} 
            items={items} 
            currency={currency} 
            isPremium={subscription.isSubscribed}
          />
        }
      />
    </div>
  );
}
