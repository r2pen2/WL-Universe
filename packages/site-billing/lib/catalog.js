const fs = require("fs");
const path = require("path");

// Prefer repo catalog in monorepo checkouts; baked copy ships in the image.
function defaultCatalogPath() {
  const repoPath = path.join(__dirname, "../../../deploy/billing/sites.json");
  const bakedPath = path.join(__dirname, "../data/sites.json");
  if (fs.existsSync(repoPath)) return repoPath;
  return bakedPath;
}

function catalogPath() {
  return process.env.SITE_BILLING_CATALOG_PATH || defaultCatalogPath();
}

// Fields a site with `billedWith: "<other id>"` takes from that site, so the two are one payment: the
// same Stripe customer and subscription, entitled together, paused together.
const BILLED_WITH_FIELDS = ["stripeCustomerId", "stripeSubscriptionId", "billingRequired", "exempt"];

/** Resolve `billedWith` links (one level, to a site that isn't itself billed with another). */
function resolveBilledWith(sites, file) {
  const byId = new Map(sites.map((s) => [s.id, s]));
  return sites.map((site) => {
    if (!site.billedWith) return site;
    const parent = byId.get(site.billedWith);
    if (!parent || parent.id === site.id) {
      throw new Error(`Invalid billing catalog at ${file}: '${site.id}' is billedWith unknown site '${site.billedWith}'`);
    }
    if (parent.billedWith) {
      throw new Error(`Invalid billing catalog at ${file}: '${site.id}' is billedWith '${parent.id}', which is itself billedWith '${parent.billedWith}'`);
    }
    const resolved = { ...site };
    for (const field of BILLED_WITH_FIELDS) resolved[field] = parent[field] ?? null;
    return resolved;
  });
}

function loadCatalog() {
  const file = catalogPath();
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.sites)) {
    throw new Error(`Invalid billing catalog at ${file}: missing sites[]`);
  }
  const sites = resolveBilledWith(data.sites, file);
  return {
    graceDays: Number(data.graceDays) || 7,
    hardStopAfterDays: Number(data.hardStopAfterDays) || 14,
    contactEmail: data.contactEmail || "joe@joed.dev",
    monthlyRetainerUsd:
      Number(data.product?.monthlyRetainerUsd || data.monthlyRetainerUsd) || 20,
    product: {
      name: data.product?.name || "Standard web hosting",
      monthlyRetainerUsd:
        Number(data.product?.monthlyRetainerUsd || data.monthlyRetainerUsd) || 20,
      stripeProductId: data.product?.stripeProductId || null,
      stripePriceId: data.product?.stripePriceId || data.stripePriceId || null,
    },
    stripePriceId: data.product?.stripePriceId || data.stripePriceId || null,
    stripeProductId: data.product?.stripeProductId || null,
    sites,
  };
}

function listSites() {
  return loadCatalog().sites;
}

function getSite(id) {
  if (!id) return null;
  return listSites().find((s) => s.id === id) || null;
}

// A Stripe customer/subscription can cover more than one catalog site (a
// shared family/bundle plan), so these return every match, not just the
// first — callers that used to treat the result as a single site need to
// iterate.
function getSitesByCustomerId(customerId) {
  if (!customerId) return [];
  return listSites().filter((s) => s.stripeCustomerId === customerId);
}

function getSitesBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return [];
  return listSites().filter((s) => s.stripeSubscriptionId === subscriptionId);
}

function sharedPriceId() {
  return loadCatalog().stripePriceId || null;
}

function policy() {
  const c = loadCatalog();
  return {
    graceDays: c.graceDays,
    hardStopAfterDays: c.hardStopAfterDays,
    contactEmail: c.contactEmail,
  };
}

module.exports = {
  resolveBilledWith,
  catalogPath,
  loadCatalog,
  listSites,
  getSite,
  getSitesByCustomerId,
  getSitesBySubscriptionId,
  sharedPriceId,
  policy,
};
