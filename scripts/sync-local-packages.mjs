import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appName = process.argv[2];

if (appName !== "nicole-levin") {
  console.error(`Unsupported app "${appName ?? ""}". Expected "nicole-levin".`);
  process.exit(1);
}

const copies = [
  {
    from: path.join(repoRoot, "packages", "web-legos"),
    to: path.join(repoRoot, "packages", "nicole-levin", "client", "src", "libraries", "Web-Legos")
  },
  {
    from: path.join(repoRoot, "packages", "server-legos"),
    to: path.join(repoRoot, "packages", "nicole-levin", "libraries", "Server-Legos")
  }
];

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
