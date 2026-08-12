#!/usr/bin/env node
/**
 * npm run stack — start shared microservices for local CRA clients.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STACK_SERVICES } from "./catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, "deploy/local/.env");
const examplePath = path.join(root, "deploy/local/.env.example");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

if (!fs.existsSync(envPath)) {
  console.error(
    `[stack] Missing ${path.relative(root, envPath)}\n` +
      `Copy ${path.relative(root, examplePath)} → deploy/local/.env and fill keys.`,
  );
  process.exit(1);
}

const fileEnv = loadEnvFile(envPath);
const env = { ...process.env, ...fileEnv };

const missing = [];
for (const svc of STACK_SERVICES) {
  if (svc.optional) continue;
  if (!env[svc.envKey]) missing.push(svc.envKey);
}
if (missing.length) {
  console.error(
    `[stack] Missing required env in deploy/local/.env: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const services = STACK_SERVICES.filter((s) => {
  if (!s.optional) return true;
  if (s.name === "site-mail") {
    return process.argv.includes("--mail") || Boolean(env.SITE_MAIL_API_KEY);
  }
  if (s.name === "wl-forms") {
    return process.argv.includes("--forms") || Boolean(env.WL_FORMS_API_KEY);
  }
  return Boolean(env[s.envKey]);
});

console.log(
  `[stack] starting: ${services.map((s) => `${s.name}:${s.port}`).join(", ")}`,
);

const children = services.map((svc) => {
  const childEnv = {
    ...env,
    PORT: String(svc.port),
  };
  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["start", "-w", svc.workspace],
    {
      cwd: root,
      env: childEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  child.on("exit", (code, signal) => {
    console.log(
      `[stack] ${svc.name} exited code=${code} signal=${signal || ""}`,
    );
  });
  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
