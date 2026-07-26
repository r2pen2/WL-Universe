import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appName = process.argv[2];

if (!appName) {
  console.error("Usage: node scripts/sync-local-packages.mjs <app-package-directory>");
  process.exit(1);
}

const appDir = path.join(repoRoot, "packages", appName);
const copies = [];

if (!fs.existsSync(appDir)) {
  console.error(`Unknown app package "${appName}". Expected ${path.relative(repoRoot, appDir)} to exist.`);
  process.exit(1);
}

if (fs.existsSync(path.join(appDir, "client"))) {
  copies.push({
    from: path.join(repoRoot, "packages", "web-legos"),
    to: path.join(appDir, "client", "src", "libraries", "Web-Legos")
  });
}

copies.push({
  from: path.join(repoRoot, "packages", "server-legos"),
  to: path.join(appDir, "libraries", "Server-Legos")
});

const excludedNames = new Set([".git", "node_modules"]);

for (const { from, to } of copies) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, {
    recursive: true,
    filter: (source) => !excludedNames.has(path.basename(source))
  });
  console.log(`Synced ${path.relative(repoRoot, from)} -> ${path.relative(repoRoot, to)}`);
}
