const crypto = require("crypto");
const catalog = require("./catalog");
const { getStripe } = require("./stripe-client");

// Permanent sign-up links for clients: https://billing.joed.dev/join/<site>/<token>.
//
// A Stripe Checkout link expires within a day, which is no good in an email. This link never expires:
// each click opens a fresh Checkout Session (mode=subscription, the shared hosting price) on the site's
// existing Stripe customer, so the webhook links the new subscription to the site by customer id. The
// token is an HMAC of the site id with SITE_BILLING_API_KEY, so links can't be guessed or swapped.
//
// Catalog fields used: stripeCustomerId (required), hosts[0] (return page), subscriptionStartsAt
// (optional ISO date: no charge until then, e.g. when the client already paid through that date), and
// riders (sites billedWith this one) for the Stripe metadata.

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due", "incomplete"]);

function secret() {
  const key = process.env.SITE_BILLING_API_KEY;
  if (!key) throw new Error("SITE_BILLING_API_KEY is not configured");
  return key;
}

function joinToken(siteId) {
  return crypto.createHmac("sha256", secret()).update(`join:${siteId}`).digest("hex").slice(0, 32);
}

function joinUrl(siteId, base = process.env.SITE_BILLING_PUBLIC_URL || "https://billing.joed.dev") {
  return `${base.replace(/\/$/, "")}/join/${encodeURIComponent(siteId)}/${joinToken(siteId)}`;
}

function validToken(siteId, token) {
  const expected = Buffer.from(joinToken(siteId));
  const given = Buffer.from(String(token || ""));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Unix time to start billing, if the site's subscriptionStartsAt is more than two days away. */
function trialEnd(site, now = Date.now()) {
  if (!site.subscriptionStartsAt) return null;
  const at = Date.parse(site.subscriptionStartsAt);
  if (Number.isNaN(at) || at - now < 2 * 24 * 3600 * 1000) return null;
  return Math.floor(at / 1000);
}

/**
 * What a click on the site's link should do: { redirect } to Stripe Checkout, or { page } when there's
 * nothing to pay (already signed up). Throws with statusCode for bad links.
 */
async function startJoin(siteId, token, { stripe = getStripe(), now = Date.now() } = {}) {
  const site = catalog.getSite(siteId);
  if (!site || site.billedWith || !validToken(siteId, token)) {
    const err = new Error("This sign-up link isn't valid.");
    err.statusCode = 404;
    throw err;
  }
  if (!site.stripeCustomerId) {
    const err = new Error("Billing for this site isn't set up yet.");
    err.statusCode = 409;
    throw err;
  }
  const price = catalog.sharedPriceId();
  if (!price) {
    const err = new Error("Hosting price isn't configured.");
    err.statusCode = 503;
    throw err;
  }

  const existing = await stripe.subscriptions.list({ customer: site.stripeCustomerId, status: "all", limit: 20 });
  const current = existing.data.find(
    (s) => ACTIVE_STATUSES.has(s.status) && !s.cancel_at_period_end && s.items.data.some((i) => i.price.id === price),
  );
  if (current) {
    return { page: "already", site };
  }

  const riders = catalog.listSites().filter((s) => s.billedWith === site.id).map((s) => s.id);
  const siteIds = [site.id, ...riders].join(",");
  const host = (site.hosts && site.hosts[0]) || "joed.dev";
  const end = trialEnd(site, now);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: site.stripeCustomerId,
    line_items: [{ price, quantity: 1 }],
    payment_method_collection: "always",
    subscription_data: {
      metadata: { wlSiteId: site.id, site_ids: siteIds },
      ...(end ? { trial_end: end } : {}),
    },
    metadata: { wlSiteId: site.id, site_ids: siteIds },
    success_url: `https://${host}/?billing=success`,
    cancel_url: `https://${host}/?billing=cancelled`,
  });
  return { redirect: session.url, site };
}

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;color:#222;line-height:1.5}h1{font-size:1.4rem}</style></head>
<body><h1>${title}</h1><p>${body}</p><p>Questions? <a href="mailto:joe@joed.dev">joe@joed.dev</a></p></body></html>`;
}

function attachJoinRoutes(app, deps = {}) {
  app.get("/join/:site/:token", async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const result = await startJoin(req.params.site, req.params.token, deps);
      if (result.redirect) return res.redirect(303, result.redirect);
      return res
        .status(200)
        .type("html")
        .send(page("You're all set", `${result.site.label || result.site.id} is already signed up for hosting. Nothing else to do.`));
    } catch (error) {
      const status = error.statusCode || 502;
      return res
        .status(status)
        .type("html")
        .send(page("Sign-up link problem", status === 502 ? "Something went wrong reaching our payment provider. Please try again in a minute." : error.message));
    }
  });
}

module.exports = { joinToken, joinUrl, validToken, trialEnd, startJoin, attachJoinRoutes };
