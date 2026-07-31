const { applyTraefikBlocks } = require("./traefik-blocks");
const { readState, writeState, computeEntitlement } = require("./entitlement");
const { listSites } = require("./catalog");
const logger = require("./logger");

/**
 * Recompute entitlements from current stripeStatus timers, then apply
 * Traefik soft-blocks. Compose stop/start is applied by the host agent
 * (scripts/billing/enforce-compose.mjs) reading composeDesired from state.
 */
function enforceAll(now = new Date()) {
  const state = readState();
  let changed = false;

  for (const site of listSites()) {
    const prev = state.sites[site.id];
    if (!prev) continue;
    const computed = computeEntitlement(prev, prev.stripeStatus, now);
    const next = {
      ...prev,
      ...computed,
      updatedAt: now.toISOString(),
    };
    if (
      next.entitlement !== prev.entitlement ||
      next.softBlocked !== prev.softBlocked ||
      next.composeDesired !== prev.composeDesired ||
      next.pastDueSince !== prev.pastDueSince
    ) {
      changed = true;
      state.sites[site.id] = next;
    }
  }

  if (changed) {
    writeState(state);
  }

  const traefik = applyTraefikBlocks();
  logger.info("enforce_complete", {
    changed,
    softBlocked: traefik.blocked,
  });

  return {
    changed,
    softBlocked: traefik.blocked,
    sites: Object.values(readState().sites).map((s) => ({
      id: s.id,
      entitlement: s.entitlement,
      composeDesired: s.composeDesired,
    })),
  };
}

module.exports = { enforceAll };
