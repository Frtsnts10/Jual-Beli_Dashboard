"use client";

import { useQuery } from "@tanstack/react-query";
import { useStoreId } from "./use-store-id";
import { getSubscriptionStatus } from "@/features/subscription/server/subscription-actions";

export function useSubscription() {
  const storeId = useStoreId();

  return useQuery({
    queryKey: ["subscription", storeId],
    queryFn: async () => {
      if (!storeId) return { isSubscribed: false, plan: "free", status: "inactive" };
      return await getSubscriptionStatus();
    },
    enabled: !!storeId,
  });
}
