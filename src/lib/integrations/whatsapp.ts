/** Normalises an Indonesian phone number to the international digits wa.me expects. */
export function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export interface DeliveredAccount {
  product: string;
  /** The template for this account's product (product's own, store's, or automatic). */
  template: string;
  values: Record<string, string>;
  /** "2/5" for a shared entry, "" otherwise. */
  slot: string;
}

/**
 * The delivery message for an order. A bundle repeats the seller's template once per
 * account (with {product} set to that component), separated by a divider.
 */
export function deliveryMessage(base: { store: string; order_id: string; expiry: string }, accounts: DeliveredAccount[]) {
  return accounts
    .map((a) => {
      const vars: Record<string, string> = { ...base, product: a.product, slot: a.slot || "-" };
      for (const [k, v] of Object.entries(a.values)) vars[k] = v || "-";
      // Placeholders with nothing to fill (e.g. no PIN) read "-" instead of showing "{pin}".
      return fillTemplate(a.template, vars).replace(/\{(\w+)\}/g, "-");
    })
    .join("\n\n———\n\n");
}
