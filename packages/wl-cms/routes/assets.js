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
 * Mount at /assets — public image blobs (no Bearer).
 * GET /assets/:site/images/...
 */
function attachPublicAssets(app) {
  app.get(/^\/assets\/([^/]+)\/(.+)$/, (req, res) => {
    const siteSlug = req.params[0];
    const rel = req.params[1];
    const site = getSite(siteSlug);
    if (!site) {
      return res.sendStatus(404);
    }
    try {
      const ctx = getOrCreateContext(site);
      const filePath = safeJoinImages(ctx.imagesDir, rel);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.sendStatus(404);
      }
      return res.sendFile(filePath);
    } catch {
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
    const filePath = safeJoinImages(req.wlCtx.imagesDir, rel);
    if (!filePath || !fs.existsSync(filePath)) {
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
};
