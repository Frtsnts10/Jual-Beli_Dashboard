import React from "react";
import { getCustomersAction } from "@/features/customers/actions/customer-actions";
import { getInventoryAction } from "@/features/inventory/actions/inventory-actions";
import { CustomerTable } from "@/features/customers/components/customer-table";

export default async function TenantCustomersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [customers, inventoryItems] = await Promise.all([
    getCustomersAction(storeId),
    getInventoryAction(storeId),
  ]);

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Customer CRM Vectors</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Bind external purchasing profiles and inspect transaction counts securely.
        </p>
      </div>

      <CustomerTable storeId={storeId} customers={customers} inventoryItems={inventoryItems} />
    </div>
  );
}
