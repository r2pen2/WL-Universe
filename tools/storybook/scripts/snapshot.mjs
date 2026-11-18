#!/usr/bin/env node
/**
 * Pre-render the catalog's "On each site" / Fonts data: open the deployed catalog in headless
 * Chromium with ?wlLive=1, let stories/_support/usages.jsx harvest every site (the same code the
 * browser runs), and write what it found as JSON for nginx to serve at /snapshot/usages.json.
 * No npm dependencies: drives Chromium over the DevTools protocol (Node 22+ has WebSocket).
 *
 *   node snapshot.mjs <catalog url> <out.json> [chromium path]
 * Run on glados by scripts/glados/storybook-snapshot.sh (in the Playwright image, for Chromium).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [base, out, chromeArg] = process.argv.slice(2);
if (!base || !out) {
  console.error("usage: snapshot.mjs <catalog url> <out.json> [chromium path]");
  process.exit(2);
}

function findChromium() {
  if (chromeArg) return chromeArg;
  // Playwright images keep browsers under /ms-playwright/<name>-<build>/...
  const roots = ["/ms-playwright"].filter((d) => fs.existsSync(d));
  for (const root of roots) {
    for (const dir of fs.readdirSync(root).filter((d) => d.startsWith("chromium")).sort().reverse()) {
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-linux/headless_shell", "chrome-headless-shell-linux64/chrome-headless-shell"]) {
        const p = path.join(root, dir, rel);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  throw new Error("Chromium not found; pass its path as the third argument");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "wl-snapshot-"));
const chrome = spawn(findChromium(), [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

let ws;
try {
  let targets;
  for (let i = 0; i < 100 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {
      await sleep(200);
    }
  }
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const i = ++id;
    pending.set(i, resolve);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const url = `${base.replace(/\/$/, "")}/iframe.html?id=foundations-fonts--overview&viewMode=story&wlLive=1`;
  console.log(`harvesting ${url}`);
  await send("Page.navigate", { url });

  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline && !(await evaluate("window.__wlHarvestDone === true"))) await sleep(2000);
  if (!(await evaluate("window.__wlHarvestDone === true"))) throw new Error("harvest didn't finish in 10 minutes");

  const snapshot = JSON.parse(await evaluate("JSON.stringify(window.__wlHarvestSnapshot())"));
  const done = snapshot.sites.filter((s) => s.status === "done");
  for (const s of snapshot.sites) console.log(`${s.site.label}: ${s.status}${s.error ? ` (${s.error})` : ""}`);
  if (!done.length || done.length < snapshot.sites.length / 2) throw new Error(`only ${done.length}/${snapshot.sites.length} sites harvested; keeping the previous snapshot`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = `${out}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(snapshot));
  fs.chmodSync(tmp, 0o644);
  fs.renameSync(tmp, out);
  console.log(`wrote ${out} (${Math.round(fs.statSync(out).size / 1024)} KB, ${done.length}/${snapshot.sites.length} sites)`);
} catch (err) {
  console.error(`snapshot failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  try {
    ws?.close();
  } catch {}
  chrome.kill();
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {}
}
