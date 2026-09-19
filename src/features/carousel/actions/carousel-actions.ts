"use server";

import { adminDb, verifyStoreAccess } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export interface CarouselSlide {
  id: string;
  store_id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCarouselSlidesAction(storeId: string): Promise<CarouselSlide[]> {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) throw new Error("Unauthorized access to store");

  const snap = await adminDb.collection("carousel_slides")
    .where("store_id", "==", storeId)
    .get();

  const slides = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarouselSlide));
  return slides.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function createCarouselSlideAction(storeId: string, formData: FormData) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  const title = (formData.get("title") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim();
  const cta_text = (formData.get("cta_text") as string)?.trim() || null;
  const cta_link = (formData.get("cta_link") as string)?.trim() || null;
  const order = parseInt(formData.get("order") as string, 10) || 0;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!title) return { error: "Title is required" };
  if (!image_url) return { error: "Image URL is required" };

  try {
    const docRef = adminDb.collection("carousel_slides").doc();
    const now = new Date().toISOString();
    const data: Omit<CarouselSlide, "id"> = {
      store_id: storeId,
      title,
      subtitle,
      image_url,
      cta_text,
      cta_link,
      order,
      active,
      created_at: now,
      updated_at: now,
    };

    await docRef.set(data);
    revalidatePath(`/${storeId}/carousel`);
    return { data: { id: docRef.id, ...data } };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateCarouselSlideAction(storeId: string, slideId: string, formData: FormData) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  const title = (formData.get("title") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim();
  const cta_text = (formData.get("cta_text") as string)?.trim() || null;
  const cta_link = (formData.get("cta_link") as string)?.trim() || null;
  const order = parseInt(formData.get("order") as string, 10) || 0;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!title) return { error: "Title is required" };
  if (!image_url) return { error: "Image URL is required" };

  try {
    await adminDb.collection("carousel_slides").doc(slideId).update({
      title,
      subtitle,
      image_url,
      cta_text,
      cta_link,
      order,
      active,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/${storeId}/carousel`);
    return { data: { id: slideId } };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleCarouselSlideActiveAction(storeId: string, slideId: string, active: boolean) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  try {
    await adminDb.collection("carousel_slides").doc(slideId).update({
      active,
      updated_at: new Date().toISOString(),
    });
    revalidatePath(`/${storeId}/carousel`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteCarouselSlideAction(storeId: string, slideId: string) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  try {
    await adminDb.collection("carousel_slides").doc(slideId).delete();
    revalidatePath(`/${storeId}/carousel`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
