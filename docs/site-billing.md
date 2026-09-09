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
stay online until you flip the flag and subscribe them to the shared product.

## Shared product

All clients buy the same Stripe product, **Standard web hosting**
(`$20/month`). Price lives on `catalog.product`, not per site. To reprice
everyone: change `product.monthlyRetainerUsd` and redeploy — bootstrap creates
the new Price and migrates every existing subscription.

## Bootstrap a client (Beyond the Bell first)

Go-live is automated on deploy once a real Stripe key is in the env file:

1. Put a real `STRIPE_SECRET_KEY` in `/opt/services/data/app-env/site-billing.env`
   (replace the `sk_test_...` stub). Optional: `SITE_BILLING_CUSTOMER_EMAIL`.
2. Deploy `site-billing`. The publish job:
   - Runs [`scripts/billing/bootstrap-stripe.mjs`](../scripts/billing/bootstrap-stripe.mjs)
     to create/reuse the shared Product + Price, the site Customer + Subscription
     (send_invoice), and webhook `https://billing.joed.dev/v1/webhooks/stripe`
   - Writes shared `prod_` / `price_` plus per-site `cus_` / `sub_` into the live catalog
   - Generates `SITE_BILLING_API_KEY` and `STRIPE_WEBHOOK_SECRET` if they are still stubs
3. Send the client a portal link via `POST /v1/portal-session`
   `{ "site": "beyond-the-bell" }`.

Manual equivalent:

```bash
sudo node scripts/billing/bootstrap-stripe.mjs \
  --env-file /opt/services/data/app-env/site-billing.env \
  --write-catalog /opt/services/apps/site-billing/catalog/sites.json \
  --write-env
```

When another client is ready: set `billingRequired: true`, set
`SITE_BILLING_BOOTSTRAP_SITE=<id>`, redeploy (or re-run bootstrap `--site <id>`).
They attach to the same Price.

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

Public hostname is **`billing.joed.dev`** (already on the glados Cloudflare tunnel).

Soft-block writes `/opt/services/infra/traefik/dynamic/billing-blocks.yml` while sites
are past grace; the file is **deleted** when all sites are clear (Traefik rejects
empty middleware maps).

## Local tests

```bash
npm test -w @wl-universe/site-billing
```
