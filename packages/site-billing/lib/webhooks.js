const {
  getSite,
  getSiteByCustomerId,
  getSiteBySubscriptionId,
} = require("./catalog");
const { applyStripeStatus, readState, writeState } = require("./entitlement");
const { enforceAll } = require("./enforcer");
const { getStripe } = require("./stripe-client");
const logger = require("./logger");

function resolveSiteFromSubscription(subscription) {
  if (!subscription) return null;
  const bySub = getSiteBySubscriptionId(subscription.id);
  if (bySub) return bySub;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  return getSiteByCustomerId(customerId);
}

function resolveSiteFromInvoice(invoice) {
  if (!invoice) return null;
  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
  if (subId) {
    const bySub = getSiteBySubscriptionId(subId);
    if (bySub) return bySub;
  }
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  return getSiteByCustomerId(customerId);
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
  let site = null;
  let stripeStatus = null;

  switch (type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.created": {
      const subscription = event.data.object;
      site = resolveSiteFromSubscription(subscription);
      if (site) {
        syncSubscriptionIds(site, subscription);
        stripeStatus =
          type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status;
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      site = resolveSiteFromInvoice(invoice);
      if (site) {
        // Prefer live subscription status when available
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subId && process.env.STRIPE_SECRET_KEY) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subId);
            syncSubscriptionIds(site, sub);
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
      site = resolveSiteFromInvoice(invoice);
      stripeStatus = "past_due";
      break;
    }
    default:
      logger.info("stripe_event_ignored", { type });
      return { ok: true, ignored: true, type };
  }

  if (!site) {
    logger.warn("stripe_event_unmapped", {
      type,
      objectId: event.data?.object?.id,
    });
    return { ok: true, unmapped: true, type };
  }

  applyStripeStatus(site.id, stripeStatus, type);
  const enforcement = enforceAll();
  logger.info("stripe_event_applied", {
    type,
    site: site.id,
    stripeStatus,
    entitlement: enforcement.sites.find((s) => s.id === site.id)?.entitlement,
  });

  return {
    ok: true,
    type,
    site: site.id,
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
  resolveSiteFromSubscription,
  resolveSiteFromInvoice,
  handleStripeEvent,
  constructEvent,
  applyStatusForSite,
};
