#!/usr/bin/env node
/**
 * Host-side compose enforcer for site-billing.
 *
 * Reads entitlement state written by packages/site-billing and runs:
 *   docker compose -f /opt/services/apps/<app>/compose.yml stop|start
 *
 * Prefer this over mounting the Docker socket into the billing container.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STATE_PATH =
  process.env.SITE_BILLING_STATE_PATH ||
  "/opt/services/data/app-assets/site-billing/state.json";
const APPLIED_PATH =
  process.env.SITE_BILLING_COMPOSE_APPLIED_PATH ||
  "/opt/services/data/app-assets/site-billing/compose-applied.json";
const APPS_ROOT =
  process.env.SITE_BILLING_APPS_ROOT || "/opt/services/apps";
const DRY_RUN = process.env.SITE_BILLING_COMPOSE_DRY_RUN === "true";

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function composeFile(app) {
  return path.join(APPS_ROOT, app, "compose.yml");
}

function runCompose(app, action) {
  const file = composeFile(app);
  if (!fs.existsSync(file)) {
    return { ok: false, error: `missing compose file: ${file}` };
  }
  if (DRY_RUN) {
    return { ok: true, dryRun: true, action, app, file };
  }
  const result = spawnSync(
    "docker",
    ["compose", "-f", file, action],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "compose failed").trim(),
      status: result.status,
    };
  }
  return { ok: true, action, app };
}

function main() {
  const state = readJson(STATE_PATH, null);
  if (!state?.sites) {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        ok: false,
        error: `no state at ${STATE_PATH}`,
      }),
    );
    process.exit(0);
  }

  const applied = readJson(APPLIED_PATH, { sites: {} });
  const results = [];

  for (const site of Object.values(state.sites)) {
    const desired = site.composeDesired === "stopped" ? "stopped" : "running";
    const current = applied.sites[site.id]?.compose || "running";
    if (desired === current) {
      continue;
    }

    const action = desired === "stopped" ? "stop" : "start";
    const app = site.composeApp || site.id;
    const result = runCompose(app, action);
    results.push({ id: site.id, app, desired, ...result });
    if (result.ok) {
      applied.sites[site.id] = {
        compose: desired,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  writeJson(APPLIED_PATH, {
    updatedAt: new Date().toISOString(),
    sites: applied.sites,
  });

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      ok: true,
      changed: results.length,
      results,
    }),
  );
}

main();
