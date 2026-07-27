/**
 * Express helper: expose site-mail runtime config for browser MailManager.
 * Mount with: app.get("/wl-mail-config", siteMailConfigHandler)
 */
function siteMailConfigHandler(_req, res) {
  res.json({
    url: process.env.SITE_MAIL_URL || "https://site-mail.joed.dev",
    apiKey: process.env.SITE_MAIL_API_KEY || "",
    site: process.env.SITE_MAIL_SITE_SLUG || "",
  });
}

module.exports = { siteMailConfigHandler };
