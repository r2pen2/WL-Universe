#!/usr/bin/env node
/**
 * WL house-rule lint over every site (AGENTS.md). From the repo root:
 *
 *   npm run lint:wl                       # fail on any new violation
 *   npm run lint:wl -- --prune-suppressions   # after fixing old ones, shrink the baseline
 *
 * Violations that existed when the lint was added are recorded in eslint-suppressions.json and
 * don't fail; any new one does, and fixing an old one lets the baseline shrink (never grow).
 * Don't run --suppress-all to silence a new violation; fix it.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const eslint = path.join(here, "node_modules", "eslint", "bin", "eslint.js");
if (!existsSync(eslint)) {
  console.error("Run `npm ci --prefix tools/wl-lint` first.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    eslint,
    "--config", path.join(here, "eslint.config.mjs"),
    "--suppressions-location", path.join(here, "eslint-suppressions.json"),
    "--max-warnings", "0",
    "--no-warn-ignored",
    "packages",
    ...process.argv.slice(2),
  ],
  { cwd: root, stdio: "inherit" },
);
process.exit(result.status ?? 1);
