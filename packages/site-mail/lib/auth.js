/**
 * Bearer API key auth for site-mail.
 * Expects Authorization: Bearer <SITE_MAIL_API_KEY>
 */
function requireApiKey(req, res, next) {
  const expected = process.env.SITE_MAIL_API_KEY;
  if (!expected) {
    return res.status(500).json({
      ok: false,
      error: "SITE_MAIL_API_KEY is not configured on the server",
    });
  }

  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match ? match[1].trim() : "";

  if (!token || token !== expected) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  return next();
}

module.exports = { requireApiKey };
