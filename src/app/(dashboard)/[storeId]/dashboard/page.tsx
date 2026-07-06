import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

import { getDashboardStats } from "@/features/dashboard/server/get-dashboard-stats";
import { DashboardClient } from "./dashboard-client";

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const stats = await getDashboardStats(storeId);

  return <DashboardClient stats={stats} />;
}
