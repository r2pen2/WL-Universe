const { listSites } = require("./catalog");
const { applyStripeStatus, readState, writeState } = require("./entitlement");
const { enforceAll } = require("./enforcer");
const { getStripe } = require("./stripe-client");
const logger = require("./logger");

async function reconcileFromStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn("reconcile_skipped_no_stripe_key");
    return { ok: false, error: "STRIPE_SECRET_KEY not set" };
  }

  const stripe = getStripe();
  const results = [];

  for (const site of listSites()) {
    if (site.exempt || !site.billingRequired) {
      results.push({ id: site.id, skipped: "exempt" });
      continue;
    }
    if (!site.stripeSubscriptionId) {
      results.push({ id: site.id, skipped: "unconfigured" });
      continue;
    }

    try {
      const sub = await stripe.subscriptions.retrieve(site.stripeSubscriptionId);
      const state = readState();
      const entry = state.sites[site.id];
      if (entry) {
        entry.stripeCustomerId =
          (typeof sub.customer === "string" ? sub.customer : sub.customer?.id) ||
          entry.stripeCustomerId;
        entry.configured = true;
        writeState(state);
      }
      applyStripeStatus(site.id, sub.status, "reconcile");
      results.push({ id: site.id, stripeStatus: sub.status });
    } catch (error) {
      logger.error("reconcile_site_failed", {
        id: site.id,
        error: error.message,
      });
      results.push({ id: site.id, error: error.message });
    }
  }

  const enforcement = enforceAll();
  return { ok: true, results, softBlocked: enforcement.softBlocked };
}

module.exports = { reconcileFromStripe };
