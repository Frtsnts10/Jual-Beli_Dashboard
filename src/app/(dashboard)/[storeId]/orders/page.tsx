import React from "react";
import { getOrdersAction } from "@/features/orders/actions/order-actions";
import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function TenantOrdersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();

  const [storeRes, orders, inventoryItems] = await Promise.all([
    supabase.from("stores").select("currency").eq("id", storeId).single(),
    getOrdersAction(storeId),
    getInventoryAction(storeId),
  ]);

  const currency = storeRes.data?.currency || "IDR";

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
