const path = require("path");
const fs = require("fs");

const REPO_ROOT = path.resolve(__dirname, "../../..");

/**
 * Canonical CMS site registry.
 * stack: text/images API shape (v1 unscoped collections vs v2 siteText-{key})
 * modelsStack: ANDC uses V2 text/images but V1 models
 */
const SITE_REGISTRY = {
  "nicole-levin": {
    slug: "nicole-levin",
    siteKey: "NL",
    stack: "v2",
    modelsStack: "v2",
  },
  "talk-about-dreams": {
    slug: "talk-about-dreams",
    siteKey: "TAG",
    stack: "v2",
    modelsStack: "v2",
  },
  "boston-mixtape": {
    slug: "boston-mixtape",
    siteKey: "BBM",
    stack: "v2",
    modelsStack: "v2",
  },
  "a-new-day-coaching": {
    slug: "a-new-day-coaching",
    siteKey: "ANDC",
    stack: "v2",
    modelsStack: "v1",
  },
  "beyond-the-bell": {
    slug: "beyond-the-bell",
    siteKey: null,
    stack: "v1",
    modelsStack: "v1",
    liveCollections: ["testimonials", "offerings", "staff"],
  },
  "you-can-do-it-gardening": {
    slug: "you-can-do-it-gardening",
    siteKey: null,
    stack: "v1",
    modelsStack: "v1",
  },
};

function envSaKey(slug) {
  return `WL_CMS_SA_${slug.replace(/-/g, "_").toUpperCase()}`;
}

function resolveServiceAccountPath(slug) {
  const fromEnv = process.env[envSaKey(slug)];
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }
  const defaultPath = path.join(
    REPO_ROOT,
    "packages",
    slug,
    "config",
    "serviceAccountKey.json",
  );
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  return null;
}

function assetsRoot() {
  return (
    process.env.WL_CMS_ASSETS_DIR ||
    path.join(__dirname, "..", "data", "assets")
  );
}

function siteAssetDir(slug) {
  return path.join(assetsRoot(), slug);
}

function getSite(slug) {
  if (!slug || typeof slug !== "string") return null;
  const normalized = slug.trim().toLowerCase();
  const base = SITE_REGISTRY[normalized];
  if (!base) return null;
  return {
    ...base,
    serviceAccountPath: resolveServiceAccountPath(normalized),
    assetDir: siteAssetDir(normalized),
  };
}

function listSites() {
  return Object.keys(SITE_REGISTRY);
}

function listConfiguredSites() {
  return listSites().filter((slug) => resolveServiceAccountPath(slug));
}

module.exports = {
  SITE_REGISTRY,
  REPO_ROOT,
  getSite,
  listSites,
  listConfiguredSites,
  assetsRoot,
  siteAssetDir,
  resolveServiceAccountPath,
};
