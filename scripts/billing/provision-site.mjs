#!/usr/bin/env node
/**
 * Idempotent Stripe provisioning for a WL-Universe site retainer.
 *
 * Ensures (in order), reusing anything that already exists:
 *   1. A single shared Stripe Product ("WL-Universe Hosting Retainer"),
 *      id cached at the catalog root as `stripeProductId`.
 *   2. A recurring monthly Price on that product matching the requested
 *      amount/currency (Stripe prices are immutable, so a new amount
 *      always gets its own Price; an existing matching Price is reused).
 *   3. A Stripe Customer for the site, tagged metadata.site_id.
 *   4. A Checkout Session (mode=subscription) for that customer/price,
 *      printed as a link for the client to enter payment.
 *
 * The Customer ID (not the Subscription ID — that doesn't exist until the
 * client pays) is written back into the catalog. That's enough: once the
 * client completes Checkout, Stripe creates the Subscription and fires
 * customer.subscription.created; packages/site-billing/lib/webhooks.js
 * resolves the site via stripeCustomerId and links the subscription and
 * live status automatically. No webhook code changes needed.
 *
 * Re-running for a site that already has a stripeSubscriptionId is a
 * no-op unless FORCE=1 (billing is already linked — go edit sites.json
 * by hand if you actually mean to replace it).
 *
 * Env:
 *   STRIPE_SECRET_KEY   (required) — Stripe secret key
 *   SITE_ID             (required) — must match an id in the catalog
 *   PRICE_PER_MONTH     (required) — decimal dollars, e.g. "150.00"
 *   CUSTOMER_EMAIL      (required) — client billing email for the Checkout Session
 *   CURRENCY            default "usd"
 *   FORCE               "1" to proceed even if the site already has a subscription id
 *   DRY_RUN              "1" print intended changes only, no Stripe writes
 *
 * Usage:
 *   STRIPE_SECRET_KEY=... SITE_ID=beyond-the-bell PRICE_PER_MONTH=150.00 \
 *     CUSTOMER_EMAIL=client@example.com node scripts/billing/provision-site.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(
  __dirname,
  "../../packages/site-billing/data/sites.json",
);

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
const KEY = process.env.STRIPE_SECRET_KEY;
const SITE_ID = process.env.SITE_ID;
const CURRENCY = (process.env.CURRENCY || "usd").toLowerCase();
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL;
const PRICE_PER_MONTH = process.env.PRICE_PER_MONTH;
const API = "https://api.stripe.com/v1";
const PRODUCT_NAME = "WL-Universe Hosting Retainer";

function requireEnv() {
  const missing = [];
  if (!KEY) missing.push("STRIPE_SECRET_KEY");
  if (!SITE_ID) missing.push("SITE_ID");
  if (!PRICE_PER_MONTH) missing.push("PRICE_PER_MONTH");
  if (!CUSTOMER_EMAIL) missing.push("CUSTOMER_EMAIL");
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
  const amount = Number(PRICE_PER_MONTH);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`PRICE_PER_MONTH must be a positive number, got: ${PRICE_PER_MONTH}`);
  }
  return Math.round(amount * 100); // unit_amount in cents
}

async function stripe(method, apiPath, form) {
  const res = await fetch(`${API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? form.toString() : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Stripe ${method} ${apiPath} failed (${res.status}): ${msg}`);
  }
  return json;
}

function readCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
}

function writeCatalog(catalog) {
  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
}

async function ensureProduct(catalog) {
  if (catalog.stripeProductId) {
    return catalog.stripeProductId;
  }
  console.log(`No shared product on file — will create "${PRODUCT_NAME}".`);
  if (DRY_RUN) return "prod_DRYRUN";
  const product = await stripe(
    "POST",
    "/products",
    new URLSearchParams({ name: PRODUCT_NAME }),
  );
  catalog.stripeProductId = product.id;
  console.log(`Created product ${product.id}`);
  return product.id;
}

async function ensurePrice(productId, unitAmount) {
  if (!DRY_RUN) {
    const existing = await stripe(
      "GET",
      `/prices?product=${encodeURIComponent(productId)}&active=true&limit=100`,
    );
    const match = (existing.data || []).find(
      (p) =>
        p.unit_amount === unitAmount &&
        p.currency === CURRENCY &&
        p.recurring?.interval === "month",
    );
    if (match) {
      console.log(`Reusing existing price ${match.id} (${unitAmount / 100} ${CURRENCY}/mo)`);
      return match.id;
    }
  }
  console.log(`No matching price on file — will create one for ${unitAmount / 100} ${CURRENCY}/mo.`);
  if (DRY_RUN) return "price_DRYRUN";
  const price = await stripe(
    "POST",
    "/prices",
    new URLSearchParams({
      product: productId,
      unit_amount: String(unitAmount),
      currency: CURRENCY,
      "recurring[interval]": "month",
    }),
  );
  console.log(`Created price ${price.id}`);
  return price.id;
}

async function ensureCustomer(site) {
  console.log(`Will create customer for ${site.id} <${CUSTOMER_EMAIL}>.`);
  if (DRY_RUN) return "cus_DRYRUN";
  const customer = await stripe(
    "POST",
    "/customers",
    new URLSearchParams({
      email: CUSTOMER_EMAIL,
      name: site.label,
      "metadata[site_id]": site.id,
    }),
  );
  console.log(`Created customer ${customer.id}`);
  return customer.id;
}

async function createCheckoutSession(site, customerId, priceId) {
  const host = site.hosts?.[0] || "joed.dev";
  if (DRY_RUN) {
    console.log("Would create a Checkout Session (mode=subscription) here.");
    return { url: "(dry run — no session created)" };
  }
  const session = await stripe(
    "POST",
    "/checkout/sessions",
    new URLSearchParams({
      mode: "subscription",
      customer: customerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `https://${host}/?billing=success`,
      cancel_url: `https://${host}/?billing=cancelled`,
      "subscription_data[metadata][site_id]": site.id,
      "metadata[site_id]": site.id,
    }),
  );
  return session;
}

async function main() {
  const unitAmount = requireEnv();
  const catalog = readCatalog();
  const site = (catalog.sites || []).find((s) => s.id === SITE_ID);
  if (!site) {
    throw new Error(
      `Unknown SITE_ID '${SITE_ID}'. Known ids: ${(catalog.sites || []).map((s) => s.id).join(", ")}`,
    );
  }

  if (site.stripeSubscriptionId && !FORCE) {
    console.log(
      `${site.id} already has stripeSubscriptionId=${site.stripeSubscriptionId} — nothing to do (set FORCE=1 to override).`,
    );
    return;
  }

  const productId = await ensureProduct(catalog);
  const priceId = await ensurePrice(productId, unitAmount);
  const customerId = await ensureCustomer(site);
  const session = await createCheckoutSession(site, customerId, priceId);

  site.stripeCustomerId = DRY_RUN ? site.stripeCustomerId : customerId;
  site.stripePriceId = DRY_RUN ? site.stripePriceId : priceId;
  site.billingRequired = true;

  if (DRY_RUN) {
    console.log("\nDRY RUN — no Stripe objects created, sites.json not written.");
  } else {
    writeCatalog(catalog);
    console.log(`\nUpdated ${path.relative(process.cwd(), CATALOG_PATH)}`);
  }

  console.log(`\nCheckout link for ${site.label}:\n  ${session.url}`);

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(
      summaryFile,
      [
        `### Billing provisioned for ${site.label} (\`${site.id}\`)`,
        "",
        DRY_RUN
          ? "**Dry run — nothing was created in Stripe.**"
          : `- Customer: \`${customerId}\``,
        DRY_RUN ? "" : `- Price: \`${priceId}\` (${unitAmount / 100} ${CURRENCY}/mo)`,
        DRY_RUN ? "" : `- Checkout link: ${session.url}`,
        "",
        "Send the Checkout link to the client. Once they pay, Stripe creates the",
        "subscription and site-billing links it automatically via the customer id.",
        "",
      ].join("\n"),
    );
  }
}

main().catch((err) => {
  console.error(`::error::${err.message}`);
  process.exitCode = 1;
});
