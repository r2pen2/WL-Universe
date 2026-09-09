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

function loadCatalog() {
  const file = catalogPath();
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.sites)) {
    throw new Error(`Invalid billing catalog at ${file}: missing sites[]`);
  }
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
    sites: data.sites,
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
  catalogPath,
  loadCatalog,
  listSites,
  getSite,
  getSitesByCustomerId,
  getSitesBySubscriptionId,
  sharedPriceId,
  policy,
};
