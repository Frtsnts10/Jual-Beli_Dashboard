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

All events include `wa: { provider: "fonnte" | "wablas" | "meta", token }` — the seller's
own provider credentials from *Pengaturan → WhatsApp*. Phone numbers are international
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

## Provider calls (examples)

- **Fonnte**: `POST https://api.fonnte.com/send`, header `Authorization: <token>`, form
  fields `target=<to>`, `message=<message>`.
- **Wablas**: `POST https://<your-server>.wablas.com/api/send-message`, header
  `Authorization: <token>`, JSON `{ "phone": "<to>", "message": "<message>" }`.
- **Meta Cloud API**: `POST https://graph.facebook.com/v20.0/<phone-number-id>/messages`,
  `Authorization: Bearer <token>`; free-form text only inside the 24-hour window,
  otherwise use an approved template.
