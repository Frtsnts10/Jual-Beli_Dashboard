"use server";

import { adminDb } from "@/lib/firebase/server";

export async function getDashboardStats(storeId: string) {
  const [storeSnap, invSnap, custSnap, compSnap] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    adminDb.collection("inventory").where("store_id", "==", storeId).get(),
    adminDb.collection("customers").where("store_id", "==", storeId).get(),
    adminDb.collection("complaints").where("store_id", "==", storeId).get(),
  ]);

  const currency = storeSnap.data()?.currency || "IDR";
  const inventory = invSnap.docs.map(d => d.data());
  const customers = custSnap.docs.map(d => d.data());
  const complaints = compSnap.docs.map(d => d.data());

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((acc, item) => acc + (item.stock || 0), 0);
  const totalValue = inventory.reduce((acc, item) => acc + ((item.stock || 0) * Number(item.selling_price || item.price || 0)), 0);
  const totalOrders = customers.reduce((acc, item) => acc + (item.total_orders || 0), 0);
  const activeComplaints = complaints.filter((c) => c.status !== "resolved").length;
  const totalRefunds = complaints.filter((c) => c.satisfaction_outcome && c.satisfaction_outcome.toLowerCase().includes("refund")).length;
  const resolvedComplaints = complaints.filter((c) => c.status === "resolved").length;

  let activeStreams = 0;
  let expiringSoonStreams = 0;
  let expiredStreams = 0;

  const nowMs = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  inventory.forEach((item) => {
    if (!item.date_expired) return;
    const expMs = new Date(item.date_expired).getTime();
    if (isNaN(expMs)) return;

    if (expMs < nowMs) {
      expiredStreams++;
    } else if (expMs - nowMs <= threeDaysMs) {
      expiringSoonStreams++;
    } else {
      activeStreams++;
    }
  });

  let bannedCustomers = 0;
  customers.forEach((c) => {
    const products = Array.isArray(c.purchased_products) ? c.purchased_products : [];
    const hasBanned = products.some((p: any) => p.status === "banned");
    if (hasBanned) bannedCustomers++;
  });

  // Generate Time-Series Data Matrices
  const dailyData: Record<string, { sales: number; inventory: number }> = {};
  const monthlyData: Record<string, { sales: number; inventory: number }> = {};
  const yearlyData: Record<string, { sales: number; inventory: number }> = {};

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('default', { weekday: 'short' });
    dailyData[label] = { sales: 0, inventory: 0 };
  }

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = monthNames[d.getMonth()];
    monthlyData[label] = { sales: 0, inventory: 0 };
  }

  const currentYear = now.getFullYear();
  for (let i = 2; i >= 0; i--) {
    const label = (currentYear - i).toString();
    yearlyData[label] = { sales: 0, inventory: 0 };
  }

  inventory.forEach(item => {
    const d = new Date(item.created_at);
    const dayLabel = d.toLocaleDateString('default', { weekday: 'short' });
    if (dailyData[dayLabel] && (now.getTime() - d.getTime()) < 7 * 86400000) {
      dailyData[dayLabel].inventory++;
    }
    const monthLabel = monthNames[d.getMonth()];
    if (monthlyData[monthLabel]) monthlyData[monthLabel].inventory++;
    const yearLabel = d.getFullYear().toString();
    if (yearlyData[yearLabel]) yearlyData[yearLabel].inventory++;
  });

  customers.forEach(c => {
    const products = Array.isArray(c.purchased_products) ? c.purchased_products : [];
    products.forEach((p: any) => {
      if (!p.bought_date) return;
      const d = new Date(p.bought_date);
      const dayLabel = d.toLocaleDateString('default', { weekday: 'short' });
      if (dailyData[dayLabel] && (now.getTime() - d.getTime()) < 7 * 86400000) {
        dailyData[dayLabel].sales++;
      }
      const monthLabel = monthNames[d.getMonth()];
      if (monthlyData[monthLabel]) monthlyData[monthLabel].sales++;
      const yearLabel = d.getFullYear().toString();
      if (yearlyData[yearLabel]) yearlyData[yearLabel].sales++;
    });
  });

  const chartData = {
    daily: Object.entries(dailyData).map(([name, data]) => ({ name, ...data })),
    monthly: Object.entries(monthlyData).map(([name, data]) => ({ name, ...data })),
    yearly: Object.entries(yearlyData).map(([name, data]) => ({ name, ...data })),
  };

  return {
    currency,
    totalProducts,
    totalStock,
    totalValue,
    totalCustomers: customers.length,
    totalOrders,
    activeComplaints,
    totalRefunds,
    resolvedComplaints,
    activeStreams,
    expiringSoonStreams,
    expiredStreams,
    bannedCustomers,
    chartData,
  };
}
