"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export async function getDashboardStats(storeId: string) {
  const supabase = await createServerSupabase();

  const [storeRes, inventoryRes, customersRes, complaintsRes] = await Promise.all([
    supabase.from("stores").select("currency").eq("id", storeId).single(),
    supabase.from("inventory").select("stock, selling_price, price").eq("store_id", storeId),
    supabase.from("customers").select("total_orders, purchased_products").eq("store_id", storeId),
    supabase.from("complaints").select("status, satisfaction_outcome").eq("store_id", storeId),
  ]);

  const currency = storeRes.data?.currency || "USD";
  const inventory = inventoryRes.data || [];
  const customers = customersRes.data || [];
  const complaints = complaintsRes.data || [];

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  const totalValue = inventory.reduce((acc, item) => acc + (item.stock * Number(item.selling_price || item.price || 0)), 0);
  const totalOrders = customers.reduce((acc, item) => acc + item.total_orders, 0);
  const activeComplaints = complaints.filter((c) => c.status !== "resolved").length;
  const totalRefunds = complaints.filter((c) => c.satisfaction_outcome && c.satisfaction_outcome.toLowerCase().includes("refund")).length;

  let activeStreams = 0;
  let expiringSoonStreams = 0;
  let expiredStreams = 0;

  const nowMs = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  customers.forEach((c) => {
    const products = Array.isArray(c.purchased_products) ? c.purchased_products : [];
    products.forEach((p: any) => {
      if (!p.expire_date) return;
      const expMs = new Date(p.expire_date).getTime();
      if (isNaN(expMs)) return;

      if (expMs < nowMs) {
        expiredStreams++;
      } else if (expMs - nowMs <= threeDaysMs) {
        expiringSoonStreams++;
      } else {
        activeStreams++;
      }
    });
  });

  return {
    currency,
    totalProducts,
    totalStock,
    totalValue,
    totalCustomers: customers.length,
    totalOrders,
    activeComplaints,
    totalRefunds,
    activeStreams,
    expiringSoonStreams,
    expiredStreams,
  };
}
