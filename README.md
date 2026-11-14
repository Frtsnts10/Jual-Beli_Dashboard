# Shop Dashboard — SaaS Control Center (B2B)

Multi-tenant dashboard where digital-product sellers create stores, manage products,
stock premium accounts in a vault, process orders and warranty claims, and style their
storefront. The buyer-facing storefront lives in the separate **Shop-Website** repo;
both share one Firestore database.

Spec: `plan-dashboard.md` (phase 1 implemented — see *Roadmap*).

## Stack

Next.js 16 (App Router, Server Components + Server Actions) · Tailwind CSS 4 ·
shadcn/ui (Radix) · Firebase Auth + Firestore (Admin SDK on the server) · Xendit.

## Routes

| Route | |
| --- | --- |
| `/` | Landing + pricing |
| `/sign-in`, `/sign-up`, `/forgot-password` | Firebase Auth (email/password, Google) → httpOnly session cookie |
| `/onboarding` | Create a store (tier store limit enforced) |
| `/[storeId]` | Overview: revenue, stock, alerts |
| `/[storeId]/products` | Catalogue CRUD, publish toggle |
| `/[storeId]/vault` | Credential vault — Available / Sold / Expired tabs, bulk import |
| `/[storeId]/orders` | Orders, manual payment confirm, WhatsApp delivery, 1-click warranty replacement |
| `/[storeId]/marketing` | Ultimate: WhatsApp broadcast, affiliate report + link builder, flash sale |
| `/[storeId]/billing` | Plan upgrade/renewal (monthly/yearly) paid via Xendit invoice, payment history |
| `/[storeId]/settings` | Store profile, template (tier-gated), accent colour, custom domain, Xendit connection, WA integration |
| `/api/cron/renewal-reminders` | Daily (vercel.json): H-3 renewal reminders via n8n |
| `/api/webhooks/xendit` | Invoice callback: `ORD-…` → order PAID + vault credential; `SUB-…` → activate/extend plan |

## Data model

See `src/types/schema.ts`. Root collections: `users`, `stores`, `products`,
`credentials_vault`, `orders`, plus `store_slugs` / `store_domains` (uniqueness
indexes) and `stores/{id}/private/integrations` (secrets, never public).

All reads/writes go through server code using the Admin SDK; every store-scoped action
calls `requireStore(storeId)` (ownership check). `firestore.rules` is defence in depth
and is tested against the emulator.

Fulfilment (`src/lib/fulfillment.ts`) runs in a Firestore transaction: an order gets
exactly one AVAILABLE credential even under concurrent webhooks, and the webhook is
idempotent.

## Tiers

`src/config/tiers.ts` — Starter (1 store, 50 stock, 2 templates), Pro (3 stores,
unlimited stock, all templates, auto-fulfilment), Ultimate (unlimited, custom domain,
marketing). `users.subscription_tier` is server-only and set by the webhook when a
`subscription_payments` invoice is paid. A paid plan past `subscription_expiry` acts as
Starter (computed on read, no cron).

## Payments (XenPlatform)

- **Connect Xendit** (Settings) creates a MANAGED sub-account; Xendit emails the seller to
  finish KYC. Status is mirrored in `stores/{id}/private/integrations`.
- Once the sub-account is **LIVE**, storefront invoices are created with `for-user-id`
  (money goes to the seller) and `with-split-rule` (the plan's fee % goes to the platform
  account `XENDIT_MASTER_ACCOUNT_ID`). Before that, the platform account collects
  (`orders.settlement = "PLATFORM"`) and owes the seller `amount − platform_fee`.

## Development

```bash
npm install
cp .env.example .env.local   # or: vercel env pull .env.local
npm run dev
```

Rules and indexes live in this repo (don't edit them in the console). The
**Deploy Firestore rules & indexes** GitHub Action deploys them whenever
`firestore.rules` / `firestore.indexes.json` change on `main` (or on demand from the
Actions tab); it needs the repository secret `FIREBASE_SERVICE_ACCOUNT` — setup steps are
at the top of `.github/workflows/firestore-deploy.yml`. Manual equivalent:

```bash
npx firebase-tools deploy --only firestore --project web-store-4cf23
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
vault, orders, marketing, bots and storefront settings; billing, payouts (Xendit),
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
