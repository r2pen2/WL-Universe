/**
 * Bearer API key auth for wl-cms.
 * Expects Authorization: Bearer <key>
 *
 * - WL_CMS_API_KEY: full access (the sites' key).
 * - WL_CMS_READ_API_KEY: read-only (comma-separated for several). Only GET/HEAD requests are
 *   allowed with it; anything that could change data gets 403. Used by the component catalog
 *   (storybook.joed.dev), which shows live prod content but must never edit it.
 */
function readOnlyKeys(env = process.env) {
  return String(env.WL_CMS_READ_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function requireApiKey(req, res, next) {
  const expected = process.env.WL_CMS_API_KEY;
  if (!expected) {
    return res.status(500).json({
      ok: false,
      error: "WL_CMS_API_KEY is not configured on the server",
    });
  }

  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match ? match[1].trim() : "";

  if (token && token === expected) {
    return next();
  }

  if (token && readOnlyKeys().includes(token)) {
    if (req.method === "GET" || req.method === "HEAD") {
      req.wlReadOnly = true;
      return next();
    }
    return res.status(403).json({
      ok: false,
      error: "Read-only key: this request would change data",
    });
  }

  return res.status(401).json({
    ok: false,
    error: "Unauthorized",
  });
}

module.exports = { requireApiKey, readOnlyKeys };
