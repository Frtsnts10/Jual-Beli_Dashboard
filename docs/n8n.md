# n8n automation contract

The dashboard posts **one webhook** (`N8N_WEBHOOK_URL`) for every WhatsApp message the
platform sends. Your n8n workflow only has to: verify the signature → switch on `event` →
call the store's WhatsApp provider.

## Security

Every request has `X-Signature: sha256=<hex>` = HMAC-SHA256 of the **raw request body**
with `N8N_WEBHOOK_SECRET`. In n8n, enable *Raw body* on the Webhook node and check it in a
Code node before doing anything else:

```js
const crypto = require('crypto');
const raw = $input.first().binary?.data
  ? Buffer.from($input.first().binary.data.data, 'base64').toString()
  : JSON.stringify($input.first().json.body);
const expected = 'sha256=' + crypto.createHmac('sha256', $env.N8N_WEBHOOK_SECRET).update(raw).digest('hex');
if ($input.first().json.headers['x-signature'] !== expected) throw new Error('bad signature');
return $input.all();
```

Respond with **2xx only after the message was handed to the provider**: the dashboard
marks orders as delivered (or reminders as sent) based on that status.

## Events

All events include `wa: { provider: "fonnte" | "wablas" | "meta", token, phone_number_id, server }`
— the seller's own provider credentials from *Pengaturan → WhatsApp & Bot*. `phone_number_id` is
set for Meta, `server` (e.g. `tegal.wablas.com`) for Wablas; both are `null` otherwise. Phone numbers are international
digits without `+` (e.g. `6281234567890`).

### `order.delivery` (Pro & Ultimate)
Sent right after a payment is fulfilled, after a warranty replacement, or when a paid
order gets stock.
```json
{ "event": "order.delivery", "reason": "paid" | "warranty_replacement" | "restock",
  "order_id": "ORD-…", "store_id": "…", "to": "62812…", "message": "…filled template…", "wa": {…} }
```

### `order.renewal_reminder` (Pro & Ultimate)
Daily cron (`/api/cron/renewal-reminders`, 09:00 WIB) for accounts expiring within 3 days.
```json
{ "event": "order.renewal_reminder", "order_id": "ORD-…", "store_id": "…", "to": "62812…", "message": "…", "wa": {…} }
```

### `broadcast` (Ultimate)
```json
{ "event": "broadcast", "broadcast_id": "…", "store_id": "…", "recipients": ["62812…", "…"], "message": "…", "wa": {…} }
```
Send with a delay between recipients (e.g. *Split In Batches* + *Wait* 5–10 s) to avoid
the number being flagged as spam.

### `product.restock` (Pro & Ultimate)
Sent right after the seller adds stock to a product that buyers asked to be told about
("Kabari saya" on the storefront), including bundles the new stock completes. Same shape as
`broadcast` — handle it in the same branch (with the same delay between recipients):
```json
{ "event": "product.restock", "store_id": "…", "product_id": "…", "recipients": ["62812…"], "message": "Halo! Netflix … sudah tersedia lagi … https://toko.com/p/…", "wa": {…} }
```
Requests are marked notified only when n8n answers 2xx; on an error they stay pending and
are sent with the next restock.

### `order.notice` (Pro & Ultimate)
Short payment notices — same shape as `order.delivery`, handle it in the same branch (send
`message` to `to`):
```json
{ "event": "order.notice", "kind": "buyer_paid" | "buyer_rejected" | "seller_proof",
  "order_id": "ORD-…", "store_id": "…", "to": "62812…", "message": "…", "wa": {…} }
```
- `buyer_paid` / `buyer_rejected`: from the dashboard when the seller confirms or rejects a
  payment (one per checkout; a cart is one message). `buyer_paid` carries the receipt link
  (`<storefront>/struk/<order id>`). The seller can turn these off in *Pengaturan → WhatsApp & Bot*.
- `seller_proof`: from the **storefront** when a buyer uploads a payment proof, to the
  seller's own number set in the same card. The storefront needs `N8N_WEBHOOK_URL` and
  `N8N_WEBHOOK_SECRET` too (same values as the dashboard).

## Provider calls (examples)

- **Fonnte**: `POST https://api.fonnte.com/send`, header `Authorization: <token>`, form
  fields `target=<to>`, `message=<message>`.
- **Wablas**: `POST https://<wa.server>/api/send-message`, header
  `Authorization: <token>`, JSON `{ "phone": "<to>", "message": "<message>" }`.
- **Meta Cloud API**: `POST https://graph.facebook.com/v20.0/<wa.phone_number_id>/messages`,
  `Authorization: Bearer <token>`. Free-form text (`type: "text"`) is only delivered inside the
  24-hour window after the buyer last messaged the number. Order deliveries usually fall outside
  it, so send an approved **utility template** instead (`type: "template"`), e.g. a template
  `pengiriman_akun` whose body has one variable `{{1}}`, and pass the message as that parameter.
  Template parameters may not contain line breaks or more than 4 spaces in a row, so replace
  `\n` with ` · ` before sending.
