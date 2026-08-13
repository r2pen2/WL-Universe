#!/usr/bin/env node
/**
 * npm run client -- <site-slug>
 * Starts a CRA client with localhost wl-cms (and optional site-mail) env.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLIENTS } from "./catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const envPath = path.join(root, "deploy/local/.env");

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

const slug = (process.argv[2] || "").trim();
if (!slug || slug === "--help" || slug === "-h") {
  console.log("Usage: npm run client -- <site-slug>");
  console.log("Sites:", Object.keys(CLIENTS).join(", "));
  process.exit(slug ? 0 : 1);
}

const client = CLIENTS[slug];
if (!client) {
  console.error(`[client] Unknown site '${slug}'.`);
  console.error("Known:", Object.keys(CLIENTS).join(", "));
  process.exit(1);
}

const fileEnv = loadEnvFile(envPath);
const cmsUrl = fileEnv.WL_CMS_URL || "http://localhost:3021";
const cmsKey = fileEnv.WL_CMS_API_KEY || "";
const authUrl = fileEnv.WL_AUTH_URL || "http://localhost:3022";
const authKey = fileEnv.WL_AUTH_API_KEY || "";
const formsUrl = fileEnv.WL_FORMS_URL || "http://localhost:3023";
const formsKey = fileEnv.WL_FORMS_API_KEY || "";
const mailUrl = fileEnv.SITE_MAIL_URL || "http://localhost:3020";
const mailKey = fileEnv.SITE_MAIL_API_KEY || "";

if (!cmsKey) {
  console.warn(
    `[client] WL_CMS_API_KEY missing (set in deploy/local/.env). CmsManager will try /wl-cms-config.`,
  );
}

const env = {
  ...process.env,
  ...fileEnv,
  PORT: String(client.port),
  BROWSER: process.env.BROWSER || "none",
  REACT_APP_WL_CMS_URL: cmsUrl,
  REACT_APP_WL_CMS_API_KEY: cmsKey,
  REACT_APP_WL_CMS_SITE: client.site,
  REACT_APP_WL_AUTH_URL: authUrl,
  REACT_APP_WL_AUTH_API_KEY: authKey,
  REACT_APP_WL_AUTH_SITE: client.site,
  REACT_APP_WL_FORMS_URL: formsUrl,
  REACT_APP_WL_FORMS_API_KEY: formsKey,
  REACT_APP_WL_FORMS_SITE: client.site,
  REACT_APP_SITE_MAIL_URL: mailUrl,
  REACT_APP_SITE_MAIL_API_KEY: mailKey,
  REACT_APP_SITE_MAIL_SITE_SLUG: client.site,
};

console.log(
  `[client] ${slug} → ${client.workspace} on :${client.port} (cms ${cmsUrl})`,
);

const child = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["start", "-w", client.workspace],
  {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
