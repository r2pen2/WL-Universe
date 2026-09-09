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
 * SITE_IDS (plural) provisions a shared plan instead: one Customer and one
 * Checkout Session covering every listed site, e.g. a family that owns
 * several businesses paying one combined retainer. All of them get the same
 * stripeCustomerId written back, so paying once covers all of them and a
 * failed payment blocks all of them — packages/site-billing/lib/webhooks.js
 * resolves a Stripe event to every catalog site sharing that customer id,
 * not just the first. Checkout's success/cancel redirect uses the first
 * listed site's host, and the Stripe Customer name defaults to PLAN_LABEL
 * (or the sites' labels joined together if that's not given).
 *
 * Env:
 *   STRIPE_SECRET_KEY   (required) — Stripe secret key
 *   SITE_ID             one catalog id — mutually exclusive with SITE_IDS
 *   SITE_IDS            comma-separated catalog ids sharing one subscription
 *   PLAN_LABEL           optional — Stripe Customer display name for a SITE_IDS group
 *   PRICE_PER_MONTH     (required) — decimal dollars, e.g. "150.00"
 *   CUSTOMER_EMAIL      (required) — client billing email for the Checkout Session
 *   CURRENCY            default "usd"
 *   FORCE               "1" to proceed even if a targeted site already has a subscription id
 *   DRY_RUN              "1" print intended changes only, no Stripe writes
 *
 * Usage:
 *   STRIPE_SECRET_KEY=... SITE_ID=beyond-the-bell PRICE_PER_MONTH=150.00 \
 *     CUSTOMER_EMAIL=client@example.com node scripts/billing/provision-site.mjs
 *
 *   STRIPE_SECRET_KEY=... SITE_IDS=boston-mixtape,a-new-day-coaching,a-new-day-coaching-crm \
 *     PLAN_LABEL="Dayanim Family Plan" PRICE_PER_MONTH=40.00 \
 *     CUSTOMER_EMAIL=client@example.com node scripts/billing/provision-site.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// deploy/billing/sites.json is the actual source of truth: publish-app-images.yml
// copies it onto glados as the live, read-only-mounted catalog on every deploy.
// packages/site-billing/data/sites.json is only a static fallback baked into the
// image for standalone `docker run` — writing there would never take effect.
const CATALOG_PATH = path.join(__dirname, "../../deploy/billing/sites.json");

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";
const KEY = process.env.STRIPE_SECRET_KEY;
const SITE_ID = process.env.SITE_ID;
const SITE_IDS = process.env.SITE_IDS;
const PLAN_LABEL = process.env.PLAN_LABEL;
const CURRENCY = (process.env.CURRENCY || "usd").toLowerCase();
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL;
const PRICE_PER_MONTH = process.env.PRICE_PER_MONTH;
const API = "https://api.stripe.com/v1";
const PRODUCT_NAME = "WL-Universe Hosting Retainer";

function requireEnv() {
  const missing = [];
  if (!KEY) missing.push("STRIPE_SECRET_KEY");
  if (!SITE_ID && !SITE_IDS) missing.push("SITE_ID or SITE_IDS");
  if (SITE_ID && SITE_IDS) {
    throw new Error("Set only one of SITE_ID or SITE_IDS, not both.");
  }
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

// `sites` is always an array — a single site is just a group of one. `label`
// is what the client sees as the Stripe Customer name / on their receipt.
async function ensureCustomer(sites, label) {
  const siteIds = sites.map((s) => s.id).join(",");
  console.log(`Will create customer "${label}" (${siteIds}) <${CUSTOMER_EMAIL}>.`);
  if (DRY_RUN) return "cus_DRYRUN";
  const customer = await stripe(
    "POST",
    "/customers",
    new URLSearchParams({
      email: CUSTOMER_EMAIL,
      name: label,
      "metadata[site_ids]": siteIds,
    }),
  );
  console.log(`Created customer ${customer.id}`);
  return customer.id;
}

async function createCheckoutSession(sites, customerId, priceId) {
  const siteIds = sites.map((s) => s.id).join(",");
  const host = sites[0]?.hosts?.[0] || "joed.dev";
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
      "subscription_data[metadata][site_ids]": siteIds,
      "metadata[site_ids]": siteIds,
    }),
  );
  return session;
}

async function main() {
  const unitAmount = requireEnv();
  const catalog = readCatalog();
  const wantedIds = (SITE_IDS ? SITE_IDS.split(",") : [SITE_ID])
    .map((id) => id.trim())
    .filter(Boolean);

  const sites = wantedIds.map((id) => {
    const site = (catalog.sites || []).find((s) => s.id === id);
    if (!site) {
      throw new Error(
        `Unknown site id '${id}'. Known ids: ${(catalog.sites || []).map((s) => s.id).join(", ")}`,
      );
    }
    return site;
  });
  const label =
    PLAN_LABEL || sites.map((s) => s.label).join(" + ");

  const alreadyConfigured = sites.filter((s) => s.stripeSubscriptionId);
  if (alreadyConfigured.length && !FORCE) {
    console.log(
      `Already has a subscription, nothing to do (set FORCE=1 to override): ${alreadyConfigured
        .map((s) => `${s.id}=${s.stripeSubscriptionId}`)
        .join(", ")}`,
    );
    return;
  }

  const productId = await ensureProduct(catalog);
  const priceId = await ensurePrice(productId, unitAmount);
  const customerId = await ensureCustomer(sites, label);
  const session = await createCheckoutSession(sites, customerId, priceId);

  for (const site of sites) {
    site.stripeCustomerId = DRY_RUN ? site.stripeCustomerId : customerId;
    site.stripePriceId = DRY_RUN ? site.stripePriceId : priceId;
    site.billingRequired = true;
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN — no Stripe objects created, sites.json not written.");
  } else {
    writeCatalog(catalog);
    console.log(`\nUpdated ${path.relative(process.cwd(), CATALOG_PATH)}`);
  }

  console.log(`\nCheckout link for ${label}:\n  ${session.url}`);

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(
      summaryFile,
      [
        `### Billing provisioned for ${label} (\`${sites.map((s) => s.id).join(", ")}\`)`,
        "",
        DRY_RUN
          ? "**Dry run — nothing was created in Stripe.**"
          : `- Customer: \`${customerId}\``,
        DRY_RUN ? "" : `- Price: \`${priceId}\` (${unitAmount / 100} ${CURRENCY}/mo)`,
        DRY_RUN ? "" : `- Checkout link: ${session.url}`,
        "",
        sites.length > 1
          ? "One subscription covers all the sites listed above: paying once activates all of them, and a failed payment later blocks all of them together."
          : "",
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
