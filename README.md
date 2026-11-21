# Jual — Seller Dashboard (B2B)

**Jual** (domain `belidi.biz.id`, dashboard at `jual.belidi.biz.id`) is a multi-tenant dashboard where digital-product sellers create stores, manage products,
stock premium accounts in a vault, process orders and warranty claims, and style their
storefront. The buyer-facing storefront lives in the separate **Shop-Website** repo;
both share one Firestore database.

Highlights: one-QRIS cart checkout with proof upload, encrypted credential vault, automatic
WhatsApp delivery through n8n, warranty claims, vouchers, reviews, customers, analytics,
live order updates, and a platform admin that runs plans, features and storefront themes.

## Stack

Next.js 16 (App Router, Server Components + Server Actions) · Tailwind CSS 4 ·
shadcn/ui (Radix) · Firebase Auth + Firestore (Admin SDK on the server) · QRIS (each seller's own for orders, the platform's for plans) — no payment gateway.

## Routes

| Route | |
| --- | --- |
| `/` | Landing + pricing |
| `/sign-in`, `/sign-up`, `/forgot-password` | Firebase Auth (email/password, Google) → httpOnly session cookie |
| `/onboarding` | Create a store (tier store limit enforced) |
| `/[storeId]` | Overview: revenue, stock, alerts |
| `/[storeId]/products` | Catalogue CRUD, publish toggle |
| `/[storeId]/vault` | Credential vault — Available / Sold / Expired tabs, bulk import |
| `/[storeId]/orders` | Orders and carts, QRIS proof check (confirm / reject), WhatsApp delivery, 1-click warranty replacement |
| `/receipt/[storeId]/[orderId]` | Seller's printable receipt of a paid order or cart |
| `/[storeId]/analytics` | Revenue, conversion, daily chart, top products/referrals; CSV export (`/analytics/export`) |
| `/platform` | Platform admin (emails in `PLATFORM_ADMIN_EMAILS`): totals, stores (suspend), users (set plan), plan payments (platform QRIS, confirm proofs), buyer account-deletion requests (approve / reject), Bantuan (seller reports), Pengumuman (banners + notifications), Paket (prices, limits, features per plan), Tema (storefront templates and their style), per-seller feature overrides |
| `/[storeId]/marketing` | Ultimate: WhatsApp broadcast, affiliate report + link builder, flash sale |
| `/[storeId]/billing` | Plan upgrade/renewal (monthly/yearly) paid to the platform QRIS with proof upload, payment history |
| `/[storeId]/settings` | Store QRIS (Pembayaran), store profile, template (tier-gated), accent colour, custom domain, WA integration |
| `/api/cron/renewal-reminders` | Daily (vercel.json): H-3 renewal reminders via n8n |

## Project layout

```
src/
  app/                 routes — (auth), (dashboard)/[storeId]/…, (platform)/platform, api/
  components/ui/       shadcn/ui primitives
  config/tiers.ts      plans, templates, limits
  features/<area>/     UI + server actions per area (products, vault, orders, payments, team, bots…)
  lib/
    access/            session, store access (requireStore), platform admins, team
    data/              Firestore mappers and read queries (incl. analytics)
    payments/          order fulfilment, manual QRIS confirmation/expiry, plan subscriptions
    integrations/      n8n automation, WhatsApp text, Telegram/Discord bots, Vercel domains
    firebase/          Admin + client SDK setup
    vault-crypto.ts    encryption at rest for vault secrets
  types/schema.ts      Firestore data model (copied in the storefront repo)
tests/                 Vitest (unit + Firestore emulator)
docs/n8n.md            automation webhook contract
```

Firestore rules and indexes live **only in this repo** and are deployed by
`.github/workflows/firestore-deploy.yml`.

## Data model

See `src/types/schema.ts`. Root collections: `users`, `stores`, `products`,
`credentials_vault`, `orders`, plus `store_slugs` / `store_domains` (uniqueness
indexes) and `stores/{id}/private/integrations` (secrets, never public).

All reads/writes go through server code using the Admin SDK; every store-scoped action
calls `requireStore(storeId)` (ownership check). `firestore.rules` is defence in depth
and is tested against the emulator.

Fulfilment (`src/lib/payments/fulfillment.ts`) runs in a Firestore transaction: an order gets
exactly one AVAILABLE credential even under concurrent webhooks, and the webhook is
idempotent.

## Plans, features and themes

Platform admins run the catalogue from `/platform/plans` and `/platform/themes`; it is stored in
`platform/catalog` and read by both apps (`src/lib/catalog-core.ts`, copied in the storefront
repo; `src/config/tiers.ts` holds the defaults used until the admin saves).

- **Per plan** (Starter / Pro / Ultimate): name, monthly/yearly price, store and stock limits
  (or unlimited), features (auto-fulfilment, vouchers, marketing, custom domain, team) and
  which templates the plan may use.
- **Per theme**: enable/disable, name and description, and its style (corner radius, font,
  accent colour) applied on the storefront.
- **Per seller** (`/platform/users` → fitur khusus): force a feature on or off, grant extra
  templates or custom limits (`users/{uid}.feature_overrides`).

`users.subscription_tier` is server-only. Plans are bought on **Langganan**: the seller
pays the platform's QRIS (set in `/platform/payments`, stored in `platform/settings`) for the
exact amount with a kode unik and uploads a proof; a platform admin confirms it there, which
activates or extends the plan (`subscription_payments`). A paid plan past `subscription_expiry` acts as
Starter (computed on read, no cron). Admin accounts (`PLATFORM_ADMIN_EMAILS`) only see `/platform`;
they have no store or plan.

## Tema AI

Sellers on a plan with the **Tema AI** feature (Paket, or per seller) can click *Buat tema dengan
AI* in Pengaturan → Toko. Claude (`src/lib/ai/theme.ts`, structured output) picks one of the
templates their plan allows, an accent colour, corner style and font, and writes a tagline and
the "Tentang toko" text; nothing is free-form code. The seller previews it before applying;
corners/font are stored per store in `stores/{id}.theme_override` and read by the storefront.
Admins switch it on and set the monthly quota per seller in Tema (stored in `platform/catalog.ai`).
Needs `ANTHROPIC_API_KEY` on the dashboard project.

## Live updates

Every store page polls a small order fingerprint (`src/features/dashboard/live-actions.ts`, five
count queries) every 8 seconds while the tab is visible. When a new order arrives, a buyer
uploads a payment proof, or a payment or warranty claim changes, the page re-renders in place
and a toast says what happened.

## Demo and admin accounts

- **Demo / showcase** (`scripts/seed-demo.mjs`, or Actions → *Seed demo account*): seller
  `demo@belidi.biz.id` (Ultimate, store "Toko Demo" at `demo.<root domain>`) and buyer
  `pembeli.demo@belidi.biz.id`. Both carry the custom claim `demo: true`, which makes them
  **read-only** and opens them without a password: **Coba demo** on the sign-in and landing pages
  (`/demo`) for the seller, **Masuk sebagai pembeli demo** on the demo store's `/masuk` for the
  buyer. Every server action that changes data starts with `demoBlocked()` (`lib/access/demo.ts`);
  invites are never accepted for the demo login. Visitors can still check out on the demo store as
  guests and use "Simulasikan pembayaran". Re-running the script resets the demo store's data.
- **Platform admin** (`scripts/create-admin.mjs`, or Actions → *Create platform admin*, needs the
  `ADMIN_PASSWORD` secret): creates the login with a verified email. Then add the email to
  `PLATFORM_ADMIN_EMAILS` on Vercel and redeploy.
- **WhatsApp through n8n**: [docs/n8n-setup.md](docs/n8n-setup.md) (ready-to-import workflow included).

## Help desk, announcements and notifications

- **Bantuan** (`/[storeId]/support`): sellers report bugs or ask questions, with an optional screenshot;
  platform admins answer in `/platform/support` (Baru / Diproses / Selesai).
- **Pengumuman** (`/platform/announcements`): a banner on the dashboards of all users or selected plans,
  plus a notification to each of them; it ends on its date or with "Akhiri".
- **Bell** in the dashboard header: replies, new reports (admins), plan payment confirmed or rejected,
  plan ending in 3 days (the daily cron), announcements.
- **Push to browser/phone** (Firebase Cloud Messaging), opt-in per device from the bell:
  1. Firebase console → Project settings → Cloud Messaging → *Web Push certificates* → **Generate key pair**.
  2. Put the public key in Vercel as `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and redeploy.
  3. Optional: `DASHBOARD_PUBLIC_URL` (e.g. `https://dashboard.example.com`) so a tapped push opens the right page.

  On iPhone, push works only after the dashboard is added to the Home Screen (iOS 16.4+).

## Images (Firebase Storage)

Logo, product photos and hero-banner slides are uploaded from the dashboard: the browser
resizes them (WebP/JPEG), the server stores them under `stores/{storeId}/{logo|banner|product}/`
in the default bucket (`web-store-dashboard.firebasestorage.app`) and saves a download-token
URL. Setup: Firebase console → upgrade to **Blaze** → **Storage → Get started**, then paste
`storage.rules` (closed to clients). The service account already has access. Hero slides live
in `stores/{id}.hero_slides` (max 5) and show on top of every storefront template.

## Payments (seller's own QRIS)

Store orders are paid straight to each seller's own QRIS — the platform never holds buyers'
money and charges no transaction fee.

- **Settings → Pembayaran**: the owner uploads their static QRIS image; it is decoded in the
  browser (`jsqr`), validated (`lib/qris.ts`: format, CRC, Rupiah) and only the payload is
  stored on `stores.payment`.
- **Checkout** (storefront) adds a 1–499 rupiah *kode unik* and shows that QRIS with the
  exact amount filled in. The buyer must upload a payment screenshot within 60 minutes
  (`payment_proofs/{orderId}`).
- **Pesanan → Cek pembayaran**: the seller compares the proof with their mutations and
  confirms (PAID → vault credential → WhatsApp delivery) or rejects with a reason. Rejected
  and expired orders release their voucher use (`lib/payments/manual.ts`). Unpaid orders
  expire when the seller opens Pesanan and nightly with the renewal cron.

## Development

```bash
npm install
cp .env.example .env.local   # or: vercel env pull .env.local
npm run dev
```

Tests (Vitest): `npm test` runs unit tests; `npm run test:emulator` also runs the
Firestore-emulator suites — fulfilment (incl. concurrent orders and bundles), warranty
replacement and the security rules. Needs Java and `firebase-tools`. CI
(`.github/workflows/ci.yml`) runs typecheck, lint, build and all tests on every PR.

Rules and indexes live in this repo (don't edit them in the console). The
**Deploy Firestore rules & indexes** GitHub Action deploys them whenever
`firestore.rules` / `firestore.indexes.json` change on `main` (or on demand from the
Actions tab); it needs the repository secret `FIREBASE_SERVICE_ACCOUNT` — setup steps are
at the top of `.github/workflows/firestore-deploy.yml`. Manual equivalent:

```bash
npx firebase-tools deploy --only firestore --project web-store-dashboard
```

## Automation (n8n)

Pro & Ultimate stores with a WhatsApp provider configured get the account delivered
automatically after payment, after a warranty replacement and after a restock; buyers get
a reminder 3 days before access ends. Ultimate stores can broadcast promos. All messages
go through one signed n8n webhook — see `docs/n8n.md`. Failures are shown on the order
with a "Kirim ulang otomatis" action.

## Custom domains (Ultimate)

Settings → **Alamat toko** walks the seller through it:

1. Type the domain (`tokoku.com` or `shop.tokoku.com`) → it is reserved for the store
   (`store_domains`) and, with `VERCEL_TOKEN` + `VERCEL_STOREFRONT_PROJECT_ID`, added to the
   storefront's Vercel project (apex domains also get `www` → apex redirect).
2. The card lists the exact DNS records to create (A `76.76.21.21` / CNAME
   `cname.vercel-dns.com`, plus any TXT ownership record Vercel asks for).
3. **Cek sekarang** asks Vercel to verify, checks the DNS config, then opens
   `https://<domain>/.well-known/store-check` and requires it to answer with this store's id —
   proving DNS, TLS and routing end to end. Only then is the domain marked active and used in
   links (Lihat toko, renewal reminders, affiliate links).

Without the Vercel env vars, the platform admin adds each domain in Vercel by hand; the
live check still runs.

## Team (Ultimate)

Settings → **Tim admin**: the owner invites admins by email. A verified existing account
gets access at once; otherwise the invitation (`store_invites`) is accepted the first time
that address signs in with a verified email. Admins (`stores.admin_uids`) manage products,
vault, orders, marketing, bots and storefront settings; billing, the store's QRIS,
domains and the team stay owner-only. Plan limits always follow the **owner's** plan.

## Bundles (Ultimate)

A product can be a bundle of other products (`products.bundle_items`). A sale allocates
one credential from every component in the same transaction; delivery sends all accounts
in one WhatsApp message; a warranty replacement swaps all of them. Bundle stock = its
scarcest component.

## Community bots (Ultimate)

Settings → **Bot komunitas**:
- **Telegram** — paste a @BotFather token; the dashboard validates it and registers the
  webhook `/api/bots/telegram/<storeId>` with a random secret. `/katalog` replies with
  products and checkout buttons, `/lacak` with the tracking page.
- **Discord** — paste Application ID, Public Key and Bot Token (used once to register
  `/katalog` and `/lacak`, not stored), then set the Interactions Endpoint URL shown in the
  card. Requests are verified with Ed25519.

Checkout links carry `?ref=telegram` / `?ref=discord`, so bot sales appear in the
affiliate report. Set `DASHBOARD_PUBLIC_URL` if the dashboard sits behind a proxy that
rewrites the Host header.

## Platform admin

`/platform` is for the SaaS operator, not sellers. Access: the signed-in email must be in
`PLATFORM_ADMIN_EMAILS` **and** verified (everyone else gets a 404). It shows GMV and
subscription revenue for the month; lets you suspend a store (storefront, checkout and bots
close, the seller sees a banner) and set any user's plan by hand. Every action is written to
`platform_audit`.

## License

[MIT](LICENSE)
