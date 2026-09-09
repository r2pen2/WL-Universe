const {
  getSite,
  getSitesByCustomerId,
  getSitesBySubscriptionId,
} = require("./catalog");
const { applyStripeStatus, readState, writeState } = require("./entitlement");
const { enforceAll } = require("./enforcer");
const { getStripe } = require("./stripe-client");
const logger = require("./logger");

// A shared-plan customer/subscription (e.g. one family paying for several
// sites) resolves to more than one catalog site — always returns an array,
// possibly empty, so callers apply the event to every matching site instead
// of silently updating just the first one.
function resolveSitesFromSubscription(subscription) {
  if (!subscription) return [];
  const bySub = getSitesBySubscriptionId(subscription.id);
  if (bySub.length) return bySub;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  return getSitesByCustomerId(customerId);
}

function resolveSitesFromInvoice(invoice) {
  if (!invoice) return [];
  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
  if (subId) {
    const bySub = getSitesBySubscriptionId(subId);
    if (bySub.length) return bySub;
  }
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  return getSitesByCustomerId(customerId);
}

function syncSubscriptionIds(site, subscription) {
  if (!site || !subscription) return;
  const state = readState();
  const entry = state.sites[site.id];
  if (!entry) return;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  entry.stripeSubscriptionId = subscription.id;
  entry.stripeCustomerId = customerId || entry.stripeCustomerId;
  entry.configured = true;
  writeState(state);
}

async function handleStripeEvent(event) {
  const type = event.type;
  let sites = [];
  let stripeStatus = null;

  switch (type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.created": {
      const subscription = event.data.object;
      sites = resolveSitesFromSubscription(subscription);
      if (sites.length) {
        for (const site of sites) syncSubscriptionIds(site, subscription);
        stripeStatus =
          type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status;
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      sites = resolveSitesFromInvoice(invoice);
      if (sites.length) {
        // Prefer live subscription status when available
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subId && process.env.STRIPE_SECRET_KEY) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subId);
            for (const site of sites) syncSubscriptionIds(site, sub);
            stripeStatus = sub.status;
          } catch {
            stripeStatus = "active";
          }
        } else {
          stripeStatus = "active";
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      sites = resolveSitesFromInvoice(invoice);
      stripeStatus = "past_due";
      break;
    }
    default:
      logger.info("stripe_event_ignored", { type });
      return { ok: true, ignored: true, type };
  }

  if (!sites.length) {
    logger.warn("stripe_event_unmapped", {
      type,
      objectId: event.data?.object?.id,
    });
    return { ok: true, unmapped: true, type };
  }

  for (const site of sites) applyStripeStatus(site.id, stripeStatus, type);
  const enforcement = enforceAll();
  const siteIds = sites.map((s) => s.id);
  logger.info("stripe_event_applied", {
    type,
    sites: siteIds,
    stripeStatus,
    entitlements: enforcement.sites
      .filter((s) => siteIds.includes(s.id))
      .map((s) => ({ id: s.id, entitlement: s.entitlement })),
  });

  return {
    ok: true,
    type,
    site: siteIds[0],
    sites: siteIds,
    stripeStatus,
  };
}

function constructEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

/** Manual mapping helper for tests / admin when catalog ids are known. */
function applyStatusForSite(siteId, stripeStatus, eventType) {
  const site = getSite(siteId);
  if (!site) {
    throw new Error(`Unknown site '${siteId}'`);
  }
  applyStripeStatus(siteId, stripeStatus, eventType || "manual");
  return enforceAll();
}

module.exports = {
  resolveSitesFromSubscription,
  resolveSitesFromInvoice,
  handleStripeEvent,
  constructEvent,
  applyStatusForSite,
};
