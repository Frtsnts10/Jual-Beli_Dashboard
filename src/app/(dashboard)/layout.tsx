import React from "react";
import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  try {
    const user = await getAuthenticatedUser();

    if (user) {
      // Upsert profile in Firestore
      const profileRef = adminDb.collection("profiles").doc(user.uid);
      const profileDoc = await profileRef.get();
      if (!profileDoc.exists) {
        await profileRef.set({
          id: user.uid,
          email: user.email || "owner@premium-console.dev",
          full_name: user.name || "Verified Store Owner",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || user.uid)}`,
          is_premium: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Graceful startup flow
  }

  return <>{children}</>;
}