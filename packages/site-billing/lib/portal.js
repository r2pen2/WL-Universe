const { getSite } = require("./catalog");
const { getStripe } = require("./stripe-client");

async function createPortalSession(siteId, returnUrl) {
  const site = getSite(siteId);
  if (!site) {
    const err = new Error(`Unknown site '${siteId}'`);
    err.statusCode = 404;
    throw err;
  }
  if (!site.stripeCustomerId) {
    const err = new Error(
      `Site '${siteId}' has no stripeCustomerId — create a Stripe Customer and paste the id into deploy/billing/sites.json`,
    );
    err.statusCode = 400;
    throw err;
  }

  const defaultReturn =
    process.env.SITE_BILLING_PORTAL_RETURN_URL ||
    "https://billing.joed.dev/v1/status";
  const session = await getStripe().billingPortal.sessions.create({
    customer: site.stripeCustomerId,
    return_url: returnUrl || defaultReturn,
  });

  return {
    ok: true,
    site: site.id,
    url: session.url,
  };
}

/**
 * Bootstrap helper: create (or reuse) a Stripe Customer + Subscription
 * and return ids to paste into deploy/billing/sites.json.
 */
async function createSubscription({
  siteId,
  customerEmail,
  priceId,
  customerName,
}) {
  const site = getSite(siteId);
  if (!site) {
    const err = new Error(`Unknown site '${siteId}'`);
    err.statusCode = 404;
    throw err;
  }

  const stripe = getStripe();
  const price = priceId || site.stripePriceId;
  if (!price) {
    const err = new Error("priceId is required (body or catalog stripePriceId)");
    err.statusCode = 400;
    throw err;
  }
  if (!customerEmail) {
    const err = new Error("customerEmail is required");
    err.statusCode = 400;
    throw err;
  }

  let customerId = site.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName || site.label || site.id,
      metadata: { wlSiteId: site.id },
    });
    customerId = customer.id;
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price }],
    metadata: { wlSiteId: site.id },
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  return {
    ok: true,
    site: site.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: price,
    status: subscription.status,
    note: "Paste stripeCustomerId / stripeSubscriptionId / stripePriceId into deploy/billing/sites.json and redeploy catalog mount.",
  };
}

module.exports = { createPortalSession, createSubscription };
