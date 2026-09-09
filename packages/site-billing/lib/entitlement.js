const fs = require("fs");
const path = require("path");
const { listSites, policy } = require("./catalog");

const ENTITLEMENTS = Object.freeze({
  ACTIVE: "active",
  GRACE: "grace",
  SOFT_BLOCKED: "soft_blocked",
  SUSPENDED: "suspended",
});

const PAID_STATUSES = new Set(["active", "trialing"]);
const UNPAID_STATUSES = new Set([
  "past_due",
  "unpaid",
  "canceled",
  "incomplete_expired",
  "paused",
]);

function stateDir() {
  return (
    process.env.SITE_BILLING_STATE_DIR ||
    "/opt/services/data/app-assets/site-billing"
  );
}

function statePath() {
  return path.join(stateDir(), "state.json");
}

function defaultSiteState(site) {
  const exempt = site.exempt || !site.billingRequired;
  const configured = Boolean(site.stripeSubscriptionId);
  return {
    id: site.id,
    composeApp: site.composeApp || site.id,
    hosts: site.hosts || [],
    label: site.label || site.id,
    billingRequired: Boolean(site.billingRequired) && !site.exempt,
    exempt: Boolean(exempt),
    configured,
    stripeCustomerId: site.stripeCustomerId || null,
    stripeSubscriptionId: site.stripeSubscriptionId || null,
    stripeStatus: configured ? "unknown" : null,
    entitlement: ENTITLEMENTS.ACTIVE,
    pastDueSince: null,
    softBlocked: false,
    composeDesired: "running",
    updatedAt: null,
    lastEvent: null,
  };
}

function emptyState() {
  const sites = {};
  for (const site of listSites()) {
    sites[site.id] = defaultSiteState(site);
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sites,
  };
}

function readState() {
  const file = statePath();
  try {
    if (!fs.existsSync(file)) {
      const state = emptyState();
      writeState(state);
      return state;
    }
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return mergeCatalogIntoState(parsed);
  } catch {
    const state = emptyState();
    writeState(state);
    return state;
  }
}

function writeState(state) {
  const dir = stateDir();
  fs.mkdirSync(dir, { recursive: true });
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  const tmp = `${statePath()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  fs.renameSync(tmp, statePath());
  return next;
}

function mergeCatalogIntoState(state) {
  const sites = { ...(state.sites || {}) };
  for (const site of listSites()) {
    const prev = sites[site.id] || {};
    const base = defaultSiteState(site);
    sites[site.id] = {
      ...base,
      ...prev,
      id: site.id,
      composeApp: site.composeApp || site.id,
      hosts: site.hosts || [],
      label: site.label || site.id,
      billingRequired: base.billingRequired,
      exempt: base.exempt,
      configured: base.configured,
      stripeCustomerId: site.stripeCustomerId || prev.stripeCustomerId || null,
      stripeSubscriptionId:
        site.stripeSubscriptionId || prev.stripeSubscriptionId || null,
    };
  }
  return { ...state, sites };
}

/**
 * Compute entitlement from Stripe subscription status + grace timers.
 * @param {object} siteState
 * @param {string|null} stripeStatus
 * @param {Date} [now]
 */
function computeEntitlement(siteState, stripeStatus, now = new Date()) {
  if (siteState.exempt || !siteState.billingRequired) {
    return {
      entitlement: ENTITLEMENTS.ACTIVE,
      pastDueSince: null,
      softBlocked: false,
      composeDesired: "running",
      stripeStatus: stripeStatus || siteState.stripeStatus,
    };
  }

  const status = stripeStatus || siteState.stripeStatus || "unknown";
  const wired =
    siteState.configured ||
    Boolean(siteState.stripeSubscriptionId) ||
    PAID_STATUSES.has(status) ||
    UNPAID_STATUSES.has(status) ||
    status === "incomplete";

  // Not wired to Stripe yet — leave online so deploy does not brick sites.
  if (!wired) {
    return {
      entitlement: ENTITLEMENTS.ACTIVE,
      pastDueSince: null,
      softBlocked: false,
      composeDesired: "running",
      stripeStatus: null,
    };
  }

  if (PAID_STATUSES.has(status)) {
    return {
      entitlement: ENTITLEMENTS.ACTIVE,
      pastDueSince: null,
      softBlocked: false,
      composeDesired: "running",
      stripeStatus: status,
    };
  }

  if (!UNPAID_STATUSES.has(status) && status !== "incomplete") {
    // unknown / incomplete — keep current timers if any, else active
    if (!siteState.pastDueSince) {
      return {
        entitlement: ENTITLEMENTS.ACTIVE,
        pastDueSince: null,
        softBlocked: false,
        composeDesired: "running",
        stripeStatus: status,
      };
    }
  }

  const { graceDays, hardStopAfterDays } = policy();
  const pastDueSince = siteState.pastDueSince
    ? new Date(siteState.pastDueSince)
    : now;
  const daysPast = (now.getTime() - pastDueSince.getTime()) / (1000 * 60 * 60 * 24);

  if (daysPast < graceDays) {
    return {
      entitlement: ENTITLEMENTS.GRACE,
      pastDueSince: pastDueSince.toISOString(),
      softBlocked: false,
      composeDesired: "running",
      stripeStatus: status,
    };
  }

  if (daysPast < hardStopAfterDays) {
    return {
      entitlement: ENTITLEMENTS.SOFT_BLOCKED,
      pastDueSince: pastDueSince.toISOString(),
      softBlocked: true,
      composeDesired: "running",
      stripeStatus: status,
    };
  }

  return {
    entitlement: ENTITLEMENTS.SUSPENDED,
    pastDueSince: pastDueSince.toISOString(),
    softBlocked: true,
    composeDesired: "stopped",
    stripeStatus: status,
  };
}

function applyStripeStatus(siteId, stripeStatus, eventType, now = new Date()) {
  const state = readState();
  const site = state.sites[siteId];
  if (!site) {
    throw new Error(`Unknown site id '${siteId}'`);
  }

  const computed = computeEntitlement(site, stripeStatus, now);
  state.sites[siteId] = {
    ...site,
    ...computed,
    configured:
      site.configured ||
      Boolean(site.stripeSubscriptionId) ||
      PAID_STATUSES.has(computed.stripeStatus) ||
      UNPAID_STATUSES.has(computed.stripeStatus),
    updatedAt: now.toISOString(),
    lastEvent: eventType || site.lastEvent,
  };
  return writeState(state);
}

function statusSummary() {
  const state = readState();
  const { graceDays, hardStopAfterDays, contactEmail } = policy();
  return {
    ok: true,
    service: "site-billing",
    policy: { graceDays, hardStopAfterDays, contactEmail },
    updatedAt: state.updatedAt,
    sites: Object.values(state.sites).map((s) => ({
      id: s.id,
      label: s.label,
      entitlement: s.entitlement,
      stripeStatus: s.stripeStatus,
      softBlocked: s.softBlocked,
      composeDesired: s.composeDesired,
      pastDueSince: s.pastDueSince,
      billingRequired: s.billingRequired,
      configured: s.configured,
      updatedAt: s.updatedAt,
    })),
  };
}

function softBlockedSites() {
  const state = readState();
  return Object.values(state.sites).filter(
    (s) => s.softBlocked || s.entitlement === ENTITLEMENTS.SOFT_BLOCKED || s.entitlement === ENTITLEMENTS.SUSPENDED,
  );
}

module.exports = {
  ENTITLEMENTS,
  PAID_STATUSES,
  UNPAID_STATUSES,
  stateDir,
  statePath,
  defaultSiteState,
  emptyState,
  readState,
  writeState,
  computeEntitlement,
  applyStripeStatus,
  statusSummary,
  softBlockedSites,
};
