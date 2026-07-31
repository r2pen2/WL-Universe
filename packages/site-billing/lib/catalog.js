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

function getSiteByCustomerId(customerId) {
  if (!customerId) return null;
  return (
    listSites().find((s) => s.stripeCustomerId === customerId) || null
  );
}

function getSiteBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;
  return (
    listSites().find((s) => s.stripeSubscriptionId === subscriptionId) ||
    null
  );
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
  getSiteByCustomerId,
  getSiteBySubscriptionId,
  policy,
};
