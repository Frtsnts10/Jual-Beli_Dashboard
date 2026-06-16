"use server";

import { adminDb, adminAuth, getAuthenticatedUser } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const newPassword = formData.get("newPassword") as string;

    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: "Authentication credentials state missing" };
    }

    // Update Firestore profile
    await adminDb.collection("profiles").doc(user.uid).set({
      full_name: fullName || user.name || "Workspace Admin",
      ...(email && { email }),
      ...(role && { role }),
    }, { merge: true });

    // Update Auth Email if changed
    if (email && email !== user.email) {
      await adminAuth.updateUser(user.uid, { email });
    }

    // Update Auth Password if provided
    if (newPassword && newPassword.length >= 6) {
      await adminAuth.updateUser(user.uid, { password: newPassword });
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Profile updated successfully across active database bindings.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to finalize Profile update stream" };
  }
}
