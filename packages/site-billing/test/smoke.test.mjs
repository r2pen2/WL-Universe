import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");
const repoRoot = path.join(pkgRoot, "../..");

async function withTempEnv(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-billing-"));
  const stateDir = path.join(tmp, "state");
  const traefikPath = path.join(tmp, "traefik", "billing-blocks.yml");
  const catalogPath = path.join(repoRoot, "deploy/billing/sites.json");

  const prev = { ...process.env };
  process.env.SITE_BILLING_STATE_DIR = stateDir;
  process.env.SITE_BILLING_TRAEFIK_DYNAMIC_PATH = traefikPath;
  process.env.SITE_BILLING_CATALOG_PATH = catalogPath;
  process.env.SITE_BILLING_TRAEFIK_SERVICE_URL = "http://site-billing:3021";
  delete process.env.STRIPE_SECRET_KEY;

  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}site-billing${path.sep}`)) {
      delete require.cache[key];
    }
  }

  try {
    return await fn({ tmp, stateDir, traefikPath });
  } finally {
    process.env = prev;
    for (const key of Object.keys(require.cache)) {
      if (key.includes(`${path.sep}site-billing${path.sep}`)) {
        delete require.cache[key];
      }
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test("catalog loads billable + exempt sites", async () => {
  await withTempEnv(() => {
    const { loadCatalog } = require("../lib/catalog.js");
    const catalog = loadCatalog();
    assert.equal(catalog.graceDays, 7);
    assert.equal(catalog.hardStopAfterDays, 14);
    const btb = catalog.sites.find((s) => s.id === "beyond-the-bell");
    assert.ok(btb);
    assert.equal(btb.billingRequired, true);
    assert.equal(
      catalog.sites.find((s) => s.id === "nicole-levin").billingRequired,
      false,
    );
    assert.ok(catalog.sites.find((s) => s.id === "joe-dobbelaar").exempt);
  });
});

test("unconfigured billable site stays active", async () => {
  await withTempEnv(() => {
    const { computeEntitlement, defaultSiteState } = require("../lib/entitlement.js");
    const { getSite } = require("../lib/catalog.js");
    const site = defaultSiteState(getSite("beyond-the-bell"));
    const result = computeEntitlement(site, null);
    assert.equal(result.entitlement, "active");
    assert.equal(result.composeDesired, "running");
    assert.equal(result.softBlocked, false);
  });
});

test("fail → grace → soft block → suspend → pay restores", async () => {
  await withTempEnv(({ traefikPath }) => {
    const {
      applyStripeStatus,
      readState,
      ENTITLEMENTS,
    } = require("../lib/entitlement.js");
    const { enforceAll } = require("../lib/enforcer.js");
    const { renderBlocksYaml } = require("../lib/traefik-blocks.js");

    // Simulate configured site
    const state = readState();
    state.sites["beyond-the-bell"].configured = true;
    state.sites["beyond-the-bell"].stripeSubscriptionId = "sub_test";
    state.sites["beyond-the-bell"].stripeCustomerId = "cus_test";
    require("../lib/entitlement.js").writeState(state);

    const t0 = new Date("2026-07-01T00:00:00.000Z");
    applyStripeStatus("beyond-the-bell", "past_due", "invoice.payment_failed", t0);
    let s = readState().sites["beyond-the-bell"];
    assert.equal(s.entitlement, ENTITLEMENTS.GRACE);
    assert.equal(s.composeDesired, "running");
    assert.equal(s.softBlocked, false);

    const tGrace = new Date("2026-07-09T00:00:00.000Z"); // 8 days later (>7)
    applyStripeStatus("beyond-the-bell", "past_due", "enforce", tGrace);
    s = readState().sites["beyond-the-bell"];
    assert.equal(s.entitlement, ENTITLEMENTS.SOFT_BLOCKED);
    assert.equal(s.softBlocked, true);
    assert.equal(s.composeDesired, "running");

    const enforced = enforceAll(tGrace);
    assert.ok(enforced.softBlocked.includes("beyond-the-bell"));
    assert.ok(fs.existsSync(traefikPath));
    const yaml = fs.readFileSync(traefikPath, "utf8");
    assert.match(yaml, /billing-block-beyond-the-bell/);
    assert.match(yaml, /beyondthebelleducation\.com/);
    assert.match(yaml, /priority: 100000/);

    const tHard = new Date("2026-07-16T00:00:00.000Z"); // 15 days
    applyStripeStatus("beyond-the-bell", "past_due", "enforce", tHard);
    s = readState().sites["beyond-the-bell"];
    assert.equal(s.entitlement, ENTITLEMENTS.SUSPENDED);
    assert.equal(s.composeDesired, "stopped");

    const tPaid = new Date("2026-07-17T00:00:00.000Z");
    applyStripeStatus("beyond-the-bell", "active", "invoice.paid", tPaid);
    s = readState().sites["beyond-the-bell"];
    assert.equal(s.entitlement, ENTITLEMENTS.ACTIVE);
    assert.equal(s.composeDesired, "running");
    assert.equal(s.softBlocked, false);
    assert.equal(s.pastDueSince, null);

    enforceAll(tPaid);
    assert.equal(fs.existsSync(traefikPath), false);

    // render helper sanity
    const sample = renderBlocksYaml([
      {
        id: "x",
        hosts: ["example.com"],
      },
    ]);
    assert.match(sample, /Host\(`example\.com`\)/);
  });
});

test("webhook handleStripeEvent applies past_due and restore", async () => {
  await withTempEnv(async ({ tmp }) => {
    const catalog = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "deploy/billing/sites.json"),
        "utf8",
      ),
    );
    catalog.sites = catalog.sites.map((s) =>
      s.id === "beyond-the-bell"
        ? {
            ...s,
            stripeCustomerId: "cus_btb",
            stripeSubscriptionId: "sub_btb",
            stripePriceId: "price_btb",
          }
        : s,
    );
    const catalogPath = path.join(tmp, "sites.json");
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    process.env.SITE_BILLING_CATALOG_PATH = catalogPath;

    for (const key of Object.keys(require.cache)) {
      if (key.includes(`${path.sep}site-billing${path.sep}`)) {
        delete require.cache[key];
      }
    }

    const { handleStripeEvent } = require("../lib/webhooks.js");
    const { readState } = require("../lib/entitlement.js");

    const result = await handleStripeEvent({
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_1",
          customer: "cus_btb",
          subscription: "sub_btb",
        },
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.site, "beyond-the-bell");
    assert.equal(result.stripeStatus, "past_due");
    const s = readState().sites["beyond-the-bell"];
    assert.equal(s.entitlement, "grace");

    const paid = await handleStripeEvent({
      type: "invoice.paid",
      data: {
        object: {
          id: "in_2",
          customer: "cus_btb",
          subscription: "sub_btb",
        },
      },
    });
    assert.equal(paid.ok, true);
    const restored = readState().sites["beyond-the-bell"];
    assert.equal(restored.entitlement, "active");
    assert.equal(restored.composeDesired, "running");
  });
});

test("host compose enforcer dry-run reacts to composeDesired", async () => {
  await withTempEnv(({ stateDir, tmp }) => {
    const statePath = path.join(stateDir, "state.json");
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      statePath,
      JSON.stringify(
        {
          version: 1,
          sites: {
            "beyond-the-bell": {
              id: "beyond-the-bell",
              composeApp: "beyond-the-bell",
              composeDesired: "stopped",
            },
          },
        },
        null,
        2,
      ),
    );

    const appsRoot = path.join(tmp, "apps");
    fs.mkdirSync(path.join(appsRoot, "beyond-the-bell"), { recursive: true });
    fs.writeFileSync(
      path.join(appsRoot, "beyond-the-bell", "compose.yml"),
      "services: {}\n",
    );

    process.env.SITE_BILLING_STATE_PATH = statePath;
    process.env.SITE_BILLING_COMPOSE_APPLIED_PATH = path.join(
      stateDir,
      "compose-applied.json",
    );
    process.env.SITE_BILLING_APPS_ROOT = appsRoot;
    process.env.SITE_BILLING_COMPOSE_DRY_RUN = "true";

    const script = path.join(repoRoot, "scripts/billing/enforce-compose.mjs");
    const { spawnSync } = require("node:child_process");
    const result = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      env: process.env,
    });
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout.trim().split("\n").at(-1));
    assert.equal(payload.ok, true);
    assert.equal(payload.changed, 1);
    assert.equal(payload.results[0].action, "stop");
    assert.equal(payload.results[0].dryRun, true);
  });
});
