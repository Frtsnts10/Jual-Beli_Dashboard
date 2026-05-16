import React from "react";
import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { InventoryTable } from "@/features/inventory/components/inventory-table";

import { createServerSupabase } from "@/lib/supabase/server";

export default async function TenantInventoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabase();
  const [storeRes, items] = await Promise.all([
    supabase.from("stores").select("currency").eq("id", storeId).single(),
    getInventoryAction(storeId),
  ]);

  const currency = storeRes.data?.currency || "USD";

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div className="pt-2">
        <InventoryTable storeId={storeId} items={items} currency={currency} />
      </div>
    </div>
  );
}
