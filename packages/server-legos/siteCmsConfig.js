/**
 * Express helper: expose wl-cms runtime config for browser CmsManager.
 * Mount with: app.get("/wl-cms-config", siteCmsConfigHandler)
 */
function siteCmsConfigHandler(_req, res) {
  res.json({
    url: process.env.WL_CMS_URL || "https://wl-cms.joed.dev",
    apiKey: process.env.WL_CMS_API_KEY || "",
    site: process.env.WL_CMS_SITE || process.env.WL_CMS_SITE_SLUG || "",
  });
}

module.exports = { siteCmsConfigHandler };
