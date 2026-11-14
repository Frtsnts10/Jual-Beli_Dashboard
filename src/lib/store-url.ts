import type { Store } from "@/types/schema";

/** Public URL of a store's storefront, for "Lihat toko" links. */
/** A custom domain is used only once its setup check has passed. */
export function storefrontUrl(store: Pick<Store, "slug" | "custom_domain" | "custom_domain_status">) {
  if (store.custom_domain && store.custom_domain_status?.state === "active") return `https://${store.custom_domain}`;
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (root) return `https://${store.slug}.${root}`;
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";
  return `${base.replace(/\/$/, "")}/${store.slug}`;
}
