import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};


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
    <div className="space-y-6 font-sans transition-colors pt-2">
      <CustomerTable storeId={storeId} customers={customers} inventoryItems={inventoryItems} />
    </div>
  );
}
