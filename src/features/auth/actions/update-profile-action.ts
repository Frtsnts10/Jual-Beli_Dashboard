"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

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

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Profile updated successfully across active database bindings.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to finalize Profile update stream" };
  }
}
