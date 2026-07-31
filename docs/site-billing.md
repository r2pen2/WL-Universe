# Site-Billing — Stripe-native hosting retainers

Thin microservice that maps WL apps → Stripe Subscriptions, exposes the
**Stripe Customer Portal**, and enforces unpaid sites (Traefik soft-block →
compose hard-stop).

Public host: **`billing.joed.dev`**

## Architecture

- Catalog: [`deploy/billing/sites.json`](../deploy/billing/sites.json)
- Service: [`packages/site-billing`](../packages/site-billing)
- Compose: [`deploy/compose/site-billing.yml`](../deploy/compose/site-billing.yml)
- Host compose agent: [`scripts/billing/enforce-compose.mjs`](../scripts/billing/enforce-compose.mjs)

Stripe owns payment UX (Customer Portal). This service owns app ↔ customer
mapping and shutoff.

## Which sites are hooked up

[`deploy/billing/sites.json`](../deploy/billing/sites.json) lists **every** client
app (hosts ready for Traefik blocks). Enforcement only runs when
`billingRequired: true` **and** Stripe ids are filled.

Right now only **`beyond-the-bell`** has `billingRequired: true`. Other clients
stay online until you flip the flag and paste their Stripe ids.

## Bootstrap a client (Beyond the Bell first)

1. Put real `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` in
   `/opt/services/data/app-env/site-billing.env` (replace `sk_test_...` stubs).
2. Create a Stripe Product/Price for the monthly retainer (Dashboard or API).
3. Call `POST /v1/subscribe` with API key, or create Customer + Subscription in
   the Stripe Dashboard.
4. Paste `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId` into
   `deploy/billing/sites.json` for `beyond-the-bell`, keep
   `billingRequired: true`.
5. Deploy / copy catalog to `/opt/services/apps/site-billing/catalog/sites.json`.
6. Point a Stripe webhook at `https://billing.joed.dev/v1/webhooks/stripe`
   for: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`.
7. Send the client a portal link via `POST /v1/portal-session`
   `{ "site": "beyond-the-bell" }`.

When another client is ready: set `billingRequired: true`, paste their Stripe
ids, redeploy the catalog.

## Ops API (Bearer `SITE_BILLING_API_KEY`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/status` | Per-site entitlement |
| POST | `/v1/portal-session` | Stripe Customer Portal URL |
| POST | `/v1/subscribe` | Create customer + subscription ids |
| POST | `/v1/reconcile` | Pull live Stripe subscription statuses |
| POST | `/v1/enforce` | Recompute grace/blocks + rewrite Traefik file |
| POST | `/v1/webhooks/stripe` | Stripe webhooks (signature verified) |

## Enforcement policy

From catalog defaults (`graceDays: 7`, `hardStopAfterDays: 14`):

1. Payment fails → `grace` (site stays up).
2. After grace → `soft_blocked` (Traefik serves `/paused` for that Host).
3. After hard-stop window → `suspended` (`composeDesired: stopped`).
4. Host cron runs `enforce-compose.mjs` every 5 minutes to
   `docker compose stop|start`.
5. `invoice.paid` / subscription `active` → clear blocks and start compose.

Unconfigured billable sites (no Stripe subscription id yet) stay **active** so
deploy does not brick production before retainers are wired.

## Secrets (glados)

`/opt/services/data/app-env/site-billing.env` — see
`deploy/compose/site-billing.env.example`.

Also install host agent (cron runs as **root** for Docker socket access):

```bash
sudo cp scripts/billing/enforce-compose.mjs /opt/services/bin/wl-billing-enforce-compose.mjs
sudo chmod +x /opt/services/bin/wl-billing-enforce-compose.mjs
sudo cp deploy/cron/wl-billing.cron /etc/cron.d/wl-billing
```

Add Cloudflare Tunnel hostname `billing.joed.dev` → Traefik.

Soft-block writes `/opt/services/infra/traefik/dynamic/billing-blocks.yml` while sites
are past grace; the file is **deleted** when all sites are clear (Traefik rejects
empty middleware maps).

## Local tests

```bash
npm test -w @wl-universe/site-billing
```
