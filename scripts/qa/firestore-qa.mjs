#!/usr/bin/env node
/**
 * Seed or delete per-PR Firestore CMS collections for ephemeral QA.
 *
 *   node scripts/qa/firestore-qa.mjs seed --pr 57 --app you-can-do-it-gardening
 *   node scripts/qa/firestore-qa.mjs cleanup --pr 57 --app you-can-do-it-gardening
 *   node scripts/qa/firestore-qa.mjs cleanup --pr 57 --apps you-can-do-it-gardening,beyond-the-bell
 *
 * Uses the prod service account at:
 *   /opt/services/data/app-env/<app>-serviceAccountKey.json
 *
 * Copies root collections (except users / siteForms / existing qa-pr-*) into
 * qa-pr-<n>-<collection>, then QA apps set CMS_COLLECTION_PREFIX=qa-pr-<n>-.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_BY_NAME, cmsQaApps } from "./apps.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const SKIP_SOURCE = new Set(["users", "siteForms"]);

function parseArgs(argv) {
  const args = {
    command: null,
    pr: null,
    apps: [],
    saDir: "/opt/services/data/app-env",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!args.command && (a === "seed" || a === "cleanup")) args.command = a;
    else if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--app" && argv[i + 1]) args.apps.push(argv[++i]);
    else if (a === "--apps" && argv[i + 1]) {
      args.apps.push(
        ...argv[++i]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    } else if (a === "--sa-dir" && argv[i + 1]) args.saDir = argv[++i];
  }
  if (!args.command) throw new Error("Usage: firestore-qa.mjs seed|cleanup --pr N --app <app>");
  if (!args.pr) throw new Error("--pr is required");
  if (!args.apps.length) throw new Error("--app or --apps is required");
  for (const app of args.apps) {
    if (!APP_BY_NAME[app]) throw new Error(`Unknown app: ${app}`);
  }
  return args;
}

function prefixFor(pr) {
  return `qa-pr-${pr}-`;
}

function saPath(saDir, app) {
  return path.join(saDir, `${app}-serviceAccountKey.json`);
}

function loadAdmin(app, saFile) {
  if (!fs.existsSync(saFile)) {
    throw new Error(`Missing service account for ${app}: ${saFile}`);
  }
  // Prefer app-local firebase-admin (Docker image or workspace install).
  let admin;
  const candidates = [
    path.join(repoRoot, "packages", app, "node_modules", "firebase-admin"),
    path.join("/repo/packages", app, "node_modules", "firebase-admin"),
    path.join(repoRoot, "node_modules", "firebase-admin"),
    "firebase-admin",
  ];
  let lastErr;
  for (const c of candidates) {
    try {
      admin = require(c);
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!admin) {
    throw new Error(
      `firebase-admin not found (tried app + root node_modules). ${lastErr?.message || ""}`,
    );
  }

  // Unique app name so multiple apps can run in one process.
  const appName = `qa-${app}`;
  const existing = admin.apps.find((a) => a?.name === appName);
  if (existing) return existing.firestore();

  const serviceAccount = JSON.parse(fs.readFileSync(saFile, "utf8"));
  const firebaseApp = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
    },
    appName,
  );
  return firebaseApp.firestore();
}

async function copyCollection(db, sourceName, destName) {
  const snap = await db.collection(sourceName).get();
  if (snap.empty) {
    console.log(`  skip empty: ${sourceName}`);
    return { source: sourceName, dest: destName, docs: 0 };
  }

  // Clear destination first so re-seed is idempotent.
  await deleteCollection(db, destName);

  let pending = db.batch();
  let ops = 0;
  let total = 0;
  const commit = async () => {
    if (!ops) return;
    await pending.commit();
    pending = db.batch();
    ops = 0;
  };

  for (const doc of snap.docs) {
    pending.set(db.collection(destName).doc(doc.id), doc.data());
    ops += 1;
    total += 1;
    if (ops >= 400) await commit();
  }
  await commit();
  console.log(`  copied ${total} docs: ${sourceName} → ${destName}`);
  return { source: sourceName, dest: destName, docs: total };
}

async function deleteCollection(db, name) {
  const col = db.collection(name);
  let deleted = 0;
  for (;;) {
    const snap = await col.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
    deleted += snap.size;
  }
  if (deleted) console.log(`  deleted ${deleted} docs from ${name}`);
  return deleted;
}

function shouldCopySource(name, prefix) {
  if (!name) return false;
  if (SKIP_SOURCE.has(name)) return false;
  if (name.startsWith("qa-pr-")) return false;
  if (name.startsWith(prefix)) return false;
  return true;
}

async function seedApp(pr, app, saDir) {
  if (!cmsQaApps().has(app)) {
    console.log(`firestore seed skip (no CMS): ${app}`);
    return { app, skipped: true };
  }
  const prefix = prefixFor(pr);
  const db = loadAdmin(app, saPath(saDir, app));
  console.log(`firestore seed ${app} prefix=${prefix}`);

  const collections = await db.listCollections();
  const results = [];
  for (const col of collections) {
    const sourceName = col.id;
    if (!shouldCopySource(sourceName, prefix)) continue;
    const destName = `${prefix}${sourceName}`;
    results.push(await copyCollection(db, sourceName, destName));
  }
  return { app, prefix, collections: results };
}

async function cleanupApp(pr, app, saDir) {
  if (!cmsQaApps().has(app)) {
    console.log(`firestore cleanup skip (no CMS): ${app}`);
    return { app, skipped: true };
  }
  const prefix = prefixFor(pr);
  const db = loadAdmin(app, saPath(saDir, app));
  console.log(`firestore cleanup ${app} prefix=${prefix}`);

  const collections = await db.listCollections();
  const deleted = [];
  for (const col of collections) {
    if (!col.id.startsWith(prefix)) continue;
    const n = await deleteCollection(db, col.id);
    deleted.push({ collection: col.id, docs: n });
  }
  return { app, prefix, deleted };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const out = [];
  for (const app of args.apps) {
    if (args.command === "seed") out.push(await seedApp(args.pr, app, args.saDir));
    else out.push(await cleanupApp(args.pr, app, args.saDir));
  }
  console.log(JSON.stringify({ ok: true, command: args.command, pr: args.pr, results: out }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
