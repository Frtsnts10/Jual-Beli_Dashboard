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
| `/[storeId]/marketing` | Ultimate features (placeholder, phase 3) |
| `/[storeId]/billing` | Plan upgrade/renewal (monthly/yearly) paid via Xendit invoice, payment history |
| `/[storeId]/settings` | Store profile, template (tier-gated), accent colour, custom domain, Xendit connection, WA integration |
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

Deploy rules and indexes from the repo (don't edit them in the console):

```bash
npx firebase-tools deploy --only firestore --project web-store-4cf23
```

## Roadmap

- **Phase 3** — n8n + WhatsApp auto-delivery, H-3 renewal reminders, broadcast CRM,
  flash sale / bundling / affiliate reports, custom-domain automation, Discord/Telegram bots.
