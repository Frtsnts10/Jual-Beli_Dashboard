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
  email: string;
  password: string;
  pin: string;
}

/**
 * The delivery message for an order. A bundle repeats the seller's template once per
 * account (with {product} set to that component), separated by a divider.
 */
export function deliveryMessage(template: string, base: { store: string; order_id: string; expiry: string }, accounts: DeliveredAccount[]) {
  return accounts
    .map((a) => fillTemplate(template, { ...base, product: a.product, email: a.email, password: a.password, pin: a.pin || "-" }))
    .join("\n\n———\n\n");
}
