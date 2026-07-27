#!/usr/bin/env node
/**
 * Upsert / remove entries in /opt/services/data/app-assets/qa/active.json
 *
 *   node scripts/qa/update-active-json.mjs upsert --pr 42 --app beyond-the-bell --sha abc --url https://...
 *   node scripts/qa/update-active-json.mjs remove --pr 42
 *   node scripts/qa/update-active-json.mjs remove --pr 42 --app beyond-the-bell
 *   node scripts/qa/update-active-json.mjs list
 */
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PATH = "/opt/services/data/app-assets/qa/active.json";

function parseArgs(argv) {
  const cmd = argv[0];
  const args = {
    cmd,
    pr: null,
    app: null,
    sha: null,
    url: null,
    file: process.env.QA_ACTIVE_JSON || DEFAULT_PATH,
  };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = Number(argv[++i]);
    else if (a === "--app" && argv[i + 1]) args.app = argv[++i];
    else if (a === "--sha" && argv[i + 1]) args.sha = argv[++i];
    else if (a === "--url" && argv[i + 1]) args.url = argv[++i];
    else if (a === "--file" && argv[i + 1]) args.file = argv[++i];
  }
  return args;
}

function emptyRegistry() {
  return { updatedAt: new Date().toISOString(), deployments: [] };
}

function readRegistry(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.deployments)) data.deployments = [];
    return data;
  } catch (err) {
    if (err.code === "ENOENT") return emptyRegistry();
    throw err;
  }
}

function writeRegistry(file, data) {
  data.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function upsert(args) {
  if (args.pr == null || !args.app || !args.url) {
    throw new Error("upsert requires --pr --app --url");
  }
  const data = readRegistry(args.file);
  const now = new Date().toISOString();
  const idx = data.deployments.findIndex(
    (d) => d.pr === args.pr && d.app === args.app,
  );
  const entry = {
    pr: args.pr,
    app: args.app,
    url: args.url,
    sha: args.sha || null,
    updatedAt: now,
  };
  if (idx >= 0) data.deployments[idx] = entry;
  else data.deployments.push(entry);
  data.deployments.sort((a, b) => a.pr - b.pr || a.app.localeCompare(b.app));
  writeRegistry(args.file, data);
  console.log(JSON.stringify({ ok: true, action: "upsert", entry }, null, 2));
}

function remove(args) {
  if (args.pr == null) throw new Error("remove requires --pr");
  const data = readRegistry(args.file);
  const before = data.deployments.length;
  data.deployments = data.deployments.filter((d) => {
    if (d.pr !== args.pr) return true;
    if (args.app && d.app !== args.app) return true;
    return false;
  });
  writeRegistry(args.file, data);
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "remove",
        removed: before - data.deployments.length,
        remaining: data.deployments.length,
      },
      null,
      2,
    ),
  );
}

function list(args) {
  const data = readRegistry(args.file);
  console.log(JSON.stringify(data, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.cmd === "upsert") upsert(args);
  else if (args.cmd === "remove") remove(args);
  else if (args.cmd === "list") list(args);
  else {
    console.error("Usage: update-active-json.mjs <upsert|remove|list> ...");
    process.exit(2);
  }
}

main();
