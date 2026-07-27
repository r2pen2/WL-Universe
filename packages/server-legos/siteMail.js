/**
 * @deprecated Site mail has moved to the standalone `packages/site-mail` microservice
 * (public host: https://site-mail.joed.dev). Do not mount this router.
 *
 * Clients should use web-legos `MailManager` (or server-side fetch to `/v1/send`).
 */
class SiteMailManager {
  constructor() {
    throw new Error(
      "SiteMailManager is deprecated. Use the site-mail microservice at SITE_MAIL_URL (https://site-mail.joed.dev)."
    );
  }

  initialize() {
    throw new Error("SiteMailManager is deprecated.");
  }

  getRouter() {
    throw new Error("SiteMailManager is deprecated.");
  }
}

module.exports = SiteMailManager;
