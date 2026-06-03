import React from "react";
import { getOrdersAction } from "@/features/orders/actions/order-actions";
import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { adminDb } from "@/lib/firebase/server";

export default async function TenantOrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const [storeDoc, orders, inventoryItems] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    getOrdersAction(storeId),
    getInventoryAction(storeId),
  ]);

  const currency = storeDoc.data()?.currency || "IDR";

  return (
    <div className="space-y-6 font-sans transition-colors pt-2">
      <OrdersTable 
        storeId={storeId} 
        orders={orders} 
        inventoryItems={inventoryItems} 
        currency={currency} 
      />
    </div>
  );
}
