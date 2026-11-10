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

  if (await alreadySignedUp(stripe, site, price)) {
    return { page: "already", site };
  }

  const riders = catalog.listSites().filter((s) => s.billedWith === site.id).map((s) => s.id);
  const siteIds = [site.id, ...riders].join(",");
  const host = (site.hosts && site.hosts[0]) || "joed.dev";
  const startsAt = trialEnd(site, now);
  const returnUrls = {
    success_url: `https://${host}/?billing=success`,
    cancel_url: `https://${host}/?billing=cancelled`,
  };

  if (startsAt) {
    // Paid ahead: no trial and no $0 subscription. Save their card now (the page states the plan and its
    // start date); the checkout.session.completed webhook then creates a real $N/month subscription
    // scheduled to start on that date (completeScheduledSignup).
    const amount = catalog.loadCatalog().product.monthlyRetainerUsd;
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: site.stripeCustomerId,
      currency: "usd",
      payment_method_types: ["card"],
      custom_text: {
        submit: {
          message: `Your $${amount}/month hosting plan starts on ${formatDate(startsAt)}. You won't be charged before then.`,
        },
      },
      setup_intent_data: { metadata: { wlSiteId: site.id, site_ids: siteIds } },
      metadata: { wlSiteId: site.id, site_ids: siteIds, wlStartsAt: String(startsAt), wlPriceId: price },
      ...returnUrls,
    });
    return { redirect: session.url, site };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: site.stripeCustomerId,
    line_items: [{ price, quantity: 1 }],
    payment_method_collection: "always",
    subscription_data: { metadata: { wlSiteId: site.id, site_ids: siteIds } },
    metadata: { wlSiteId: site.id, site_ids: siteIds },
    ...returnUrls,
  });
  return { redirect: session.url, site };
}

const formatDate = (unix) =>
  new Date(unix * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** On the plan already: a live subscription at this price, or a schedule for this site that hasn't ended. */
async function alreadySignedUp(stripe, site, price) {
  const subs = await stripe.subscriptions.list({ customer: site.stripeCustomerId, status: "all", limit: 20 });
  if (subs.data.some((s) => ACTIVE_STATUSES.has(s.status) && !s.cancel_at_period_end && s.items.data.some((i) => i.price.id === price))) {
    return true;
  }
  const schedules = await stripe.subscriptionSchedules.list({ customer: site.stripeCustomerId, limit: 20 });
  return schedules.data.some(
    (s) => (s.status === "not_started" || s.status === "active") && s.metadata && s.metadata.wlSiteId === site.id,
  );
}

/**
 * Webhook side of a paid-ahead sign-up (checkout.session.completed, mode=setup, metadata.wlStartsAt):
 * make the saved card the customer's default and schedule the $N/month subscription to start on that date.
 * Idempotent per checkout session (Stripe idempotency key + an existing-schedule check).
 */
async function completeScheduledSignup(session, { stripe = getStripe() } = {}) {
  const meta = session.metadata || {};
  const startsAt = Number(meta.wlStartsAt);
  if (session.mode !== "setup" || !startsAt || !meta.wlSiteId || !meta.wlPriceId) return { skipped: true };
  const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;

  const existing = await stripe.subscriptionSchedules.list({ customer, limit: 20 });
  const already = existing.data.find(
    (s) => (s.status === "not_started" || s.status === "active") && s.metadata && s.metadata.wlSiteId === meta.wlSiteId,
  );
  if (already) return { scheduleId: already.id, existing: true };

  const setupIntentId = typeof session.setup_intent === "string" ? session.setup_intent : session.setup_intent?.id;
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethod =
    typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method?.id;
  await stripe.customers.update(customer, { invoice_settings: { default_payment_method: paymentMethod } });

  const siteMeta = { wlSiteId: meta.wlSiteId, site_ids: meta.site_ids || meta.wlSiteId };
  const schedule = await stripe.subscriptionSchedules.create(
    {
      customer,
      start_date: startsAt,
      end_behavior: "release",
      default_settings: { default_payment_method: paymentMethod, collection_method: "charge_automatically" },
      // One cycle under the schedule, then it's released as an ordinary ongoing monthly subscription.
      phases: [{ items: [{ price: meta.wlPriceId, quantity: 1 }], iterations: 1, metadata: siteMeta }],
      metadata: { ...siteMeta, wlCheckoutSession: session.id },
    },
    { idempotencyKey: `wl-schedule-${session.id}` },
  );
  return { scheduleId: schedule.id, startsAt };
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

module.exports = { joinToken, joinUrl, validToken, trialEnd, startJoin, completeScheduledSignup, attachJoinRoutes };
