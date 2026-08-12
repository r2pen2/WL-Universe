const fs = require("fs");
const { getSite } = require("./sites");
const { getDbForSite } = require("./firebase");

/** Per-site runtime state (caches + listeners). */
const contexts = new Map();

function ensureAssetDirs(site) {
  const imagesDir = `${site.assetDir}/images`;
  fs.mkdirSync(imagesDir, { recursive: true });
  return imagesDir;
}

/**
 * Resolve site from X-WL-Site header, ?site=, or body.site.
 * Attaches req.wlSite and req.wlCtx.
 */
function resolveSiteMiddleware(req, res, next) {
  const slug =
    req.get("x-wl-site") ||
    req.query.site ||
    (req.body && req.body.site) ||
    "";

  if (!slug) {
    return res.status(400).json({
      ok: false,
      error: "Missing site (X-WL-Site header, ?site=, or body.site)",
    });
  }

  const site = getSite(String(slug));
  if (!site) {
    return res.status(400).json({
      ok: false,
      error: `Unknown site '${slug}'`,
    });
  }

  try {
    req.wlSite = site;
    req.wlCtx = getOrCreateContext(site);
    return next();
  } catch (error) {
    return res.status(503).json({
      ok: false,
      error: error.message,
    });
  }
}

function getOrCreateContext(site) {
  if (contexts.has(site.slug)) {
    return contexts.get(site.slug);
  }

  const db = getDbForSite(site.slug);
  const imagesDir = ensureAssetDirs(site);
  const ctx = {
    site,
    db,
    imagesDir,
    textData: {},
    imagesData: {},
    modelData: {},
    liveData: {},
    textListening: false,
    imagesListening: false,
    modelListeners: new Set(),
    liveListeners: new Set(),
  };
  contexts.set(site.slug, ctx);
  return ctx;
}

module.exports = {
  resolveSiteMiddleware,
  getOrCreateContext,
  contexts,
};
