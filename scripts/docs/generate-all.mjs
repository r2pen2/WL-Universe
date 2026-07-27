#!/usr/bin/env node
/**
 * Docstring extract pipeline — indexes existing JSDoc/TSDoc/file headers only.
 * Never invents component documentation prose.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  rel,
  walkFiles,
  extractExportsFromSource,
  attachDemos,
} from "./lib/extract-exports.mjs";
import { parseJsdocBlock, hasDocContent } from "./lib/parse-jsdoc.mjs";

const CACHE = path.join(ROOT, ".docs-cache");
const DOCS_DATA = path.join(ROOT, "packages/docs/data");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function extractDir(absDir, exts) {
  const files = walkFiles(absDir, exts);
  const exports = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const fileRel = rel(file);
    exports.push(...extractExportsFromSource(source, fileRel));
  }
  return exports;
}

/** react-docgen-style pass: JSX components + Layouts */
function extractWebLegos() {
  const components = path.join(ROOT, "packages/web-legos/components");
  const layouts = path.join(ROOT, "packages/web-legos/Layouts");
  const items = [
    ...extractDir(components, [".jsx", ".js", ".tsx", ".ts"]),
    ...extractDir(layouts, [".jsx", ".js", ".tsx", ".ts"]),
  ];
  attachDemos(items);
  return {
    package: "web-legos",
    generatedAt: new Date().toISOString(),
    rule: "only-index-existing-jsdoc",
    exports: items,
  };
}

/** TypeDoc-equivalent: web-legos api TS files — adjacent JSDoc/TSDoc only */
function extractWebLegosApi() {
  const apiDir = path.join(ROOT, "packages/web-legos/api");
  const items = extractDir(apiDir, [".ts", ".js"]);
  return {
    package: "web-legos-api",
    generatedAt: new Date().toISOString(),
    rule: "only-index-existing-jsdoc",
    exports: items,
  };
}

/** Light JSDoc/file-header parse for server-legos CJS modules */
function extractServerLegos() {
  const dir = path.join(ROOT, "packages/server-legos");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".js") && !f.startsWith("."))
    .map((f) => path.join(dir, f));

  const modules = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const fileRel = rel(file);
    const exports = extractExportsFromSource(source, fileRel);

    // Always include a module entry from file header when present
    const headerMatch = source.match(
      /^\s*(?:\/\/[^\n]*\n|\s)*\/\*\*([\s\S]*?)\*\//
    );
    let headerDoc = null;
    if (headerMatch) {
      headerDoc = parseJsdocBlock(headerMatch[1]);
    }

    const base = path.basename(file, ".js");
    const slug = base.toLowerCase().replace(/_/g, "-");

    // Prefer export items; if empty, surface module from header or undocumented stub
    let moduleExports = exports;
    if (!moduleExports.length) {
      const undocumented = !hasDocContent(headerDoc);
      moduleExports = [
        {
          name: base,
          slug: `module--${slug}`,
          kind: "module",
          file: fileRel,
          line: 1,
          description: undocumented ? null : headerDoc?.description ?? null,
          params: undocumented ? [] : headerDoc?.params || [],
          defaults: undocumented ? null : headerDoc?.defaults ?? null,
          deprecated: undocumented ? null : headerDoc?.deprecated ?? null,
          links: undocumented ? [] : headerDoc?.links || [],
          see: undocumented ? null : headerDoc?.see ?? null,
          returns: undocumented ? null : headerDoc?.returns ?? null,
          undocumented,
          demoId: null,
        },
      ];
    }

    // Attach file-level header text for the module page (source citation)
    const headerText = headerMatch
      ? source.slice(headerMatch.index, headerMatch.index + headerMatch[0].length)
      : null;

    modules.push({
      name: base,
      slug,
      file: fileRel,
      headerText,
      header: hasDocContent(headerDoc)
        ? {
            description: headerDoc.description,
            deprecated: headerDoc.deprecated,
            params: headerDoc.params,
            defaults: headerDoc.defaults,
            links: headerDoc.links,
          }
        : null,
      exports: moduleExports,
      undocumented: moduleExports.every((e) => e.undocumented) && !hasDocContent(headerDoc),
    });
  }

  return {
    package: "server-legos",
    generatedAt: new Date().toISOString(),
    rule: "only-index-existing-jsdoc",
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

// Site inventory: packages/<app>/client/src/components
function extractSites() {
  const packagesDir = path.join(ROOT, "packages");
  const apps = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const components = path.join(
        packagesDir,
        name,
        "client/src/components"
      );
      return fs.existsSync(components);
    });

  const sites = {};
  for (const app of apps) {
    const componentsDir = path.join(
      packagesDir,
      app,
      "client/src/components"
    );
    const items = extractDir(componentsDir, [".jsx", ".js", ".tsx", ".ts"]);
    const isCrm = app.includes("crm");
    sites[app] = {
      app,
      slug: app,
      productSpecific: isCrm,
      label: isCrm
        ? "Product-specific (CRM) — not shared web-legos"
        : "Site-specific components",
      generatedAt: new Date().toISOString(),
      exports: items,
    };
    writeJson(path.join(CACHE, "sites", `${app}.json`), sites[app]);
  }

  return {
    generatedAt: new Date().toISOString(),
    rule: "only-index-existing-jsdoc",
    apps: Object.keys(sites).sort(),
    sites,
  };
}

function assertNoInventedProse(payload, label) {
  // Soft guard: descriptions must be null or strings that appear in some source file we read.
  // We already only copy from AST/comments; this documents the invariant.
  const exports = payload.exports || [];
  for (const mod of payload.modules || []) {
    for (const e of mod.exports || []) exports.push(e);
  }
  for (const e of exports) {
    if (e.description === undefined) {
      throw new Error(`[${label}] missing description field on ${e.name}`);
    }
    if (e.undocumented && e.description) {
      throw new Error(
        `[${label}] undocumented export ${e.name} has description — refuse invented copy`
      );
    }
  }
}

function main() {
  ensureDir(CACHE);
  ensureDir(DOCS_DATA);
  ensureDir(path.join(CACHE, "sites"));

  console.log("Extracting web-legos components + Layouts…");
  const webLegos = extractWebLegos();
  assertNoInventedProse(webLegos, "web-legos");
  writeJson(path.join(CACHE, "web-legos.json"), webLegos);
  writeJson(path.join(DOCS_DATA, "web-legos.json"), webLegos);

  console.log("Extracting web-legos api…");
  const webLegosApi = extractWebLegosApi();
  assertNoInventedProse(webLegosApi, "web-legos-api");
  writeJson(path.join(CACHE, "web-legos-api.json"), webLegosApi);
  writeJson(path.join(DOCS_DATA, "web-legos-api.json"), webLegosApi);

  console.log("Extracting server-legos…");
  const serverLegos = extractServerLegos();
  assertNoInventedProse(serverLegos, "server-legos");
  writeJson(path.join(CACHE, "server-legos.json"), serverLegos);
  writeJson(path.join(DOCS_DATA, "server-legos.json"), serverLegos);

  console.log("Extracting site components…");
  const sites = extractSites();
  writeJson(path.join(CACHE, "sites.json"), {
    generatedAt: sites.generatedAt,
    rule: sites.rule,
    apps: sites.apps,
  });
  writeJson(path.join(DOCS_DATA, "sites.json"), sites);

  const documented = webLegos.exports.filter((e) => !e.undocumented).length;
  const undocumented = webLegos.exports.filter((e) => e.undocumented).length;
  console.log(
    `Done. web-legos: ${documented} documented / ${undocumented} undocumented exports; server modules: ${serverLegos.modules.length}; sites: ${sites.apps.length}`
  );
}

main();
