"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";
import { Language } from "@/locales/dictionary";

export async function updateUserLanguageAction(lang: Language) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: "Authentication credentials missing" };
    }

    await adminDb.collection("profiles").doc(user.uid).set({
      preferred_language: lang
    }, { merge: true });

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update language" };
  }
}
