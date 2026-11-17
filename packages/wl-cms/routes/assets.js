const path = require("path");
const fs = require("fs");
const { getSite } = require("../lib/sites");
const { getOrCreateContext } = require("../lib/context");

function safeJoinImages(imagesDir, relativePath) {
  const cleaned = String(relativePath || "")
    .replace(/^\/+/, "")
    .replace(/^images\//, "");
  const resolved = path.resolve(imagesDir, cleaned);
  if (!resolved.startsWith(path.resolve(imagesDir))) {
    return null;
  }
  return resolved;
}

/**
 * Read-only fallback for image files missing from this instance's own assets: QA previews
 * (pr-<N>-wl-cms) start with an empty assets dir but copy prod's image metadata, so they read
 * prod's files from WL_CMS_ASSETS_FALLBACK_DIR (<root>/<slug>/images, mounted :ro). Uploads and
 * deletes only ever touch the instance's own dir.
 */
function findImageFile(site, imagesDir, rel) {
  const own = safeJoinImages(imagesDir, rel);
  if (own && fs.existsSync(own)) return own;
  const fallbackRoot = process.env.WL_CMS_ASSETS_FALLBACK_DIR;
  if (!fallbackRoot) return null;
  const fallback = safeJoinImages(path.join(fallbackRoot, site.slug, "images"), rel);
  return fallback && fs.existsSync(fallback) ? fallback : null;
}

/**
 * Mount at /assets — public image blobs (no Bearer).
 * GET /assets/:site/images/...
 */
function attachPublicAssets(app) {
  app.get(/^\/assets\/([^/]+)\/(.+)$/, (req, res) => {
    const siteSlug = req.params[0];
    const rel = req.params[1];
    const site = getSite(siteSlug);
    if (!site) {
      res.set("Cache-Control", "no-store");
      return res.sendStatus(404);
    }
    try {
      const ctx = getOrCreateContext(site);
      const filePath = findImageFile(site, ctx.imagesDir, rel);
      if (!filePath) {
        // No explicit Cache-Control here previously let browsers (per RFC 9111
        // 4.2.2, 404 is heuristically cacheable) cache a transient "missing
        // asset" 404 on disk and keep replaying it after the file showed up,
        // with no request ever reaching the origin to reveal the fix.
        res.set("Cache-Control", "no-store");
        return res.sendStatus(404);
      }
      return res.sendFile(filePath);
    } catch {
      res.set("Cache-Control", "no-store");
      return res.sendStatus(503);
    }
  });
}

/**
 * Legacy-compatible image upload/delete (requires site middleware + API key).
 */
function attachLegacyImageFs(app) {
  app.get(/^\/images\/(.+)$/, (req, res) => {
    const rel = req.params[0];
    const filePath = findImageFile(req.wlSite, req.wlCtx.imagesDir, rel);
    if (!filePath) {
      return res.sendStatus(404);
    }
    return res.sendFile(filePath);
  });

  app.post(/^\/images\/(.+)$/, (req, res) => {
    if (!req.files || !req.files.file) {
      return res.sendStatus(400);
    }
    const rel = req.params[0];
    const targetPath = safeJoinImages(req.wlCtx.imagesDir, rel);
    if (!targetPath) {
      return res.sendStatus(400);
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFile(targetPath, req.files.file.data, (err) => {
      if (err) {
        return res.sendStatus(500);
      }
      return res.sendStatus(200);
    });
  });

  app.post("/delete-img", (req, res) => {
    const raw = req.query.path || "";
    const targetPath = safeJoinImages(req.wlCtx.imagesDir, String(raw));
    if (!targetPath) {
      return res.sendStatus(400);
    }
    fs.rm(targetPath, (err) => {
      if (err) {
        return res.sendStatus(500);
      }
      return res.sendStatus(200);
    });
  });
}

module.exports = {
  attachPublicAssets,
  attachLegacyImageFs,
  safeJoinImages,
  findImageFile,
};
