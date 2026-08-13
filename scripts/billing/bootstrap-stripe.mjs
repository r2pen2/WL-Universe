#!/usr/bin/env node
/**
 * Idempotent Stripe go-live for a catalog site (default: beyond-the-bell).
 *
 * Creates/reuses Product + monthly Price + Customer + Subscription, upserts
 * the webhook endpoint at https://billing.joed.dev/v1/webhooks/stripe, and
 * writes cus_/sub_/price_ into the live catalog.
 *
 *   node scripts/billing/bootstrap-stripe.mjs \
 *     --env-file /opt/services/data/app-env/site-billing.env \
 *     --write-catalog /opt/services/apps/site-billing/catalog/sites.json
 *
 * Env (file or process):
 *   STRIPE_SECRET_KEY
 *   SITE_BILLING_BOOTSTRAP_SITE   (default beyond-the-bell)
 *   SITE_BILLING_CUSTOMER_EMAIL   (default joe@joed.dev)
 *   SITE_BILLING_RETAINER_USD     (default 75)
 *   SITE_BILLING_WEBHOOK_URL      (default https://billing.joed.dev/v1/webhooks/stripe)
 *   DRY_RUN=1
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

function parseArgs(argv) {
  const args = {
    envFile: null,
    writeCatalog: null,
    writeRepo: false,
    writeEnv: false,
    site: process.env.SITE_BILLING_BOOTSTRAP_SITE || "beyond-the-bell",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--env-file" && argv[i + 1]) args.envFile = argv[++i];
    else if (a === "--write-catalog" && argv[i + 1]) args.writeCatalog = argv[++i];
    else if (a === "--write-repo") args.writeRepo = true;
    else if (a === "--write-env") args.writeEnv = true;
    else if (a === "--site" && argv[i + 1]) args.site = argv[++i];
  }
  return args;
}

function loadEnvFile(file) {
  if (!file || !fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function isConfiguredStripeKey(key) {
  return typeof key === "string" && /^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(key);
}

function isStub(value, prefixes) {
  if (!value) return true;
  if (value.includes("...") || /replace/i.test(value)) return true;
  return prefixes.some((p) => value === p);
}

function upsertEnvKey(file, key, value) {
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const lines = raw.length ? raw.split(/\r?\n/) : [];
  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  const text = `${next.filter((l, i) => !(i === next.length - 1 && l === "")).join("\n")}\n`;
  fs.writeFileSync(file, text);
}

function readCatalog(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeCatalog(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function patchSite(catalog, siteId, ids) {
  const site = catalog.sites.find((s) => s.id === siteId);
  if (!site) throw new Error(`Site '${siteId}' not in catalog`);
  site.stripeCustomerId = ids.stripeCustomerId;
  site.stripeSubscriptionId = ids.stripeSubscriptionId;
  site.stripePriceId = ids.stripePriceId;
  site.billingRequired = true;
  return catalog;
}

async function stripe(method, pathname, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  const url = new URL(`https://api.stripe.com/v1${pathname}`);
  const headers = { Authorization: `Bearer ${key}` };
  let body;
  if (method === "GET") {
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v == null) continue;
        url.searchParams.set(k, String(v));
      }
    }
  } else if (params) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        for (const item of v) form.append(k, item);
      } else if (v != null) {
        form.set(k, String(v));
      }
    }
    body = form.toString();
  }
  const res = await fetch(url, { method, headers, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Stripe ${method} ${pathname} failed (${res.status}): ${msg}`);
  }
  return json;
}

async function listAll(pathname, extra = {}) {
  const out = [];
  let starting_after;
  for (;;) {
    const page = await stripe("GET", pathname, {
      limit: "100",
      ...extra,
      ...(starting_after ? { starting_after } : {}),
    });
    const data = page.data || [];
    out.push(...data);
    if (!page.has_more || !data.length) break;
    starting_after = data[data.length - 1].id;
  }
  return out;
}

async function ensureProduct(site) {
  const products = await listAll("/products");
  const existing = products.find(
    (p) => p.metadata?.wlSiteId === site.id && p.metadata?.wlKind === "hosting-retainer",
  );
  if (existing) {
    console.log(`Stripe product ok: ${existing.id}`);
    return existing;
  }
  console.log(`Stripe product create: ${site.label} hosting retainer`);
  if (process.env.DRY_RUN === "1") {
    return { id: "prod_dry_run", metadata: { wlSiteId: site.id } };
  }
  return stripe("POST", "/products", {
    name: `${site.label} hosting retainer`,
    "metadata[wlSiteId]": site.id,
    "metadata[wlKind]": "hosting-retainer",
  });
}

async function ensurePrice(productId, amountUsd) {
  const unitAmount = String(Math.round(Number(amountUsd) * 100));
  const prices = await listAll("/prices", { product: productId, active: "true" });
  const existing = prices.find(
    (p) =>
      String(p.unit_amount) === unitAmount &&
      p.currency === "usd" &&
      p.recurring?.interval === "month",
  );
  if (existing) {
    console.log(`Stripe price ok: ${existing.id}`);
    return existing;
  }
  console.log(`Stripe price create: $${amountUsd}/month`);
  if (process.env.DRY_RUN === "1") return { id: "price_dry_run" };
  return stripe("POST", "/prices", {
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    "recurring[interval]": "month",
  });
}

async function ensureCustomer(site, email) {
  const customers = await listAll("/customers");
  const existing = customers.find((c) => c.metadata?.wlSiteId === site.id);
  if (existing) {
    console.log(`Stripe customer ok: ${existing.id}`);
    return existing;
  }
  if (site.stripeCustomerId) {
    console.log(`Stripe customer from catalog: ${site.stripeCustomerId}`);
    return { id: site.stripeCustomerId };
  }
  console.log(`Stripe customer create: ${email}`);
  if (process.env.DRY_RUN === "1") return { id: "cus_dry_run" };
  return stripe("POST", "/customers", {
    email,
    name: site.label || site.id,
    "metadata[wlSiteId]": site.id,
  });
}

async function ensureSubscription(site, customerId, priceId) {
  const subs = await listAll("/subscriptions", {
    customer: customerId,
    status: "all",
  });
  const existing = (subs || []).find(
    (s) =>
      s.metadata?.wlSiteId === site.id &&
      s.status !== "canceled" &&
      s.status !== "incomplete_expired",
  );
  if (existing) {
    console.log(`Stripe subscription ok: ${existing.id} (${existing.status})`);
    return existing;
  }
  if (site.stripeSubscriptionId) {
    console.log(`Stripe subscription from catalog: ${site.stripeSubscriptionId}`);
    return { id: site.stripeSubscriptionId, status: "unknown" };
  }
  console.log(`Stripe subscription create for ${site.id}`);
  if (process.env.DRY_RUN === "1") {
    return { id: "sub_dry_run", status: "dry_run" };
  }
  return stripe("POST", "/subscriptions", {
    customer: customerId,
    "items[0][price]": priceId,
    "metadata[wlSiteId]": site.id,
    collection_method: "send_invoice",
    days_until_due: "7",
  });
}

async function ensureWebhook(url) {
  const endpoints = await listAll("/webhook_endpoints");
  const existing = endpoints.find((e) => e.url === url);
  if (existing) {
    console.log(`Stripe webhook ok: ${existing.id}`);
    return { endpoint: existing, secret: null, created: false };
  }
  console.log(`Stripe webhook create: ${url}`);
  if (process.env.DRY_RUN === "1") {
    return {
      endpoint: { id: "we_dry_run", url },
      secret: null,
      created: false,
    };
  }
  const form = new URLSearchParams();
  form.set("url", url);
  for (const event of WEBHOOK_EVENTS) form.append("enabled_events[]", event);
  const res = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Stripe webhook create failed (${res.status}): ${msg}`);
  }
  return { endpoint: json, secret: json.secret || null, created: true };
}

function ensureApiKey(envFile, writeEnv) {
  const current = process.env.SITE_BILLING_API_KEY;
  if (!isStub(current, ["replace-with-strong-shared-secret"])) {
    return { action: "unchanged" };
  }
  const next = crypto.randomBytes(32).toString("hex");
  process.env.SITE_BILLING_API_KEY = next;
  if (writeEnv && envFile) {
    upsertEnvKey(envFile, "SITE_BILLING_API_KEY", next);
    console.log("Generated SITE_BILLING_API_KEY (written to env file, not logged)");
    return { action: "generated" };
  }
  console.log("SITE_BILLING_API_KEY is a stub — pass --write-env to replace it");
  return { action: "stub" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.envFile) loadEnvFile(args.envFile);

  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  const repoCatalog = path.join(repoRoot, "deploy/billing/sites.json");
  const bakedCatalog = path.join(repoRoot, "packages/site-billing/data/sites.json");
  const catalogPath = args.writeCatalog || repoCatalog;
  const catalog = readCatalog(catalogPath);
  const site = catalog.sites.find((s) => s.id === args.site);
  if (!site) throw new Error(`Unknown site '${args.site}'`);

  const apiKey = ensureApiKey(args.envFile, args.writeEnv);

  if (!isConfiguredStripeKey(process.env.STRIPE_SECRET_KEY)) {
    console.log(
      JSON.stringify({
        ok: true,
        skipped: "stripe",
        reason:
          "STRIPE_SECRET_KEY is missing or still a stub. Put a real sk_test_/sk_live_ key in the env file and re-run.",
        site: site.id,
        apiKey: apiKey.action,
      }),
    );
    process.exit(0);
  }

  const email =
    process.env.SITE_BILLING_CUSTOMER_EMAIL || "joe@joed.dev";
  const amountUsd = Number(process.env.SITE_BILLING_RETAINER_USD || 75);
  const webhookUrl =
    process.env.SITE_BILLING_WEBHOOK_URL ||
    "https://billing.joed.dev/v1/webhooks/stripe";

  const product = await ensureProduct(site);
  const price = await ensurePrice(product.id, amountUsd);
  const customer = await ensureCustomer(site, email);
  const subscription = await ensureSubscription(site, customer.id, price.id);
  const webhook = await ensureWebhook(webhookUrl);

  const ids = {
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: price.id,
  };

  if (!dryRun) {
    const next = patchSite(catalog, site.id, ids);
    writeCatalog(catalogPath, next);
    if (args.writeRepo) {
      writeCatalog(repoCatalog, next);
      writeCatalog(bakedCatalog, next);
    }
    if (
      args.writeEnv &&
      args.envFile &&
      webhook.secret &&
      isStub(process.env.STRIPE_WEBHOOK_SECRET, ["whsec_..."])
    ) {
      upsertEnvKey(args.envFile, "STRIPE_WEBHOOK_SECRET", webhook.secret);
      console.log("Wrote STRIPE_WEBHOOK_SECRET to env file (not logged)");
    } else if (webhook.created && !webhook.secret) {
      console.log(
        "Webhook created but secret was not returned — set STRIPE_WEBHOOK_SECRET from the Stripe Dashboard.",
      );
    } else if (!webhook.created && isStub(process.env.STRIPE_WEBHOOK_SECRET, ["whsec_..."])) {
      console.log(
        "Webhook already exists; Stripe will not re-issue the signing secret. Paste STRIPE_WEBHOOK_SECRET from the Dashboard if the env file still has a stub.",
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        site: site.id,
        ...ids,
        subscriptionStatus: subscription.status,
        webhookId: webhook.endpoint?.id,
        webhookCreated: webhook.created,
        catalog: catalogPath,
        apiKey: apiKey.action,
        dryRun,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
