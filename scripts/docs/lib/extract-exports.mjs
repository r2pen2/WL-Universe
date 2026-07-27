import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  findPrecedingJsdoc,
  hasDocContent,
  parseJsdocBlock,
} from "./parse-jsdoc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../../..");

export function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

export function walkFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      out.push(...walkFiles(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function slugify(name, fileRel) {
  const base = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
  const fileBase = path
    .basename(fileRel)
    .replace(/\.(jsx|tsx|js|ts)$/, "")
    .toLowerCase();
  return `${fileBase}--${base}`;
}

function extractFileHeader(source) {
  const m = source.match(/^\s*(?:\/\/[^\n]*\n|\s)*\/\*\*([\s\S]*?)\*\//);
  if (!m) return null;
  return parseJsdocBlock(m[1]);
}

function makeItem({ name, fileRel, index, source, doc, kind }) {
  const undocumented = !hasDocContent(doc);
  return {
    name,
    slug: slugify(name, fileRel),
    kind: kind || "export",
    file: fileRel.replace(/\\/g, "/"),
    line: lineAt(source, index || 0),
    description: undocumented ? null : doc?.description ?? null,
    params: undocumented ? [] : doc?.params || [],
    defaults: undocumented ? null : doc?.defaults ?? null,
    deprecated: undocumented ? null : doc?.deprecated ?? null,
    links: undocumented ? [] : doc?.links || [],
    see: undocumented ? null : doc?.see ?? null,
    returns: undocumented ? null : doc?.returns ?? null,
    undocumented,
    demoId: null,
  };
}

const EXPORT_PATTERNS = [
  /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
  /export\s+class\s+([A-Za-z0-9_$]+)/g,
  /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g,
  /export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
  /export\s+default\s+class\s+([A-Za-z0-9_$]+)/g,
  /export\s+default\s+([A-Za-z0-9_$]+)\s*;/g,
];

function extractEsmExports(source, fileRel) {
  const items = [];
  const seen = new Set();

  for (const pattern of EXPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const jsdoc = findPrecedingJsdoc(source, match.index);
      items.push(
        makeItem({
          name,
          fileRel,
          index: match.index,
          source,
          doc: jsdoc?.doc || null,
        })
      );
    }
  }

  const namedBlock = /export\s*\{([^}]+)\}/g;
  let nb;
  while ((nb = namedBlock.exec(source)) !== null) {
    for (const part of nb[1].split(",")) {
      const bits = part.trim().split(/\s+as\s+/);
      const name = (bits[1] || bits[0] || "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const jsdoc = findPrecedingJsdoc(source, nb.index);
      items.push(
        makeItem({
          name,
          fileRel,
          index: nb.index,
          source,
          doc: jsdoc?.doc || null,
        })
      );
    }
  }

  return items;
}

function extractCommonJsExports(source, fileRel) {
  const items = [];
  const header = extractFileHeader(source);

  for (const m of source.matchAll(
    /module\.exports\s*=\s*([A-Za-z0-9_$]+)\s*;/g
  )) {
    const jsdoc = findPrecedingJsdoc(source, m.index);
    const doc = jsdoc && hasDocContent(jsdoc.doc) ? jsdoc.doc : header;
    items.push(
      makeItem({
        name: m[1],
        fileRel,
        index: m.index,
        source,
        doc,
        kind: "module",
      })
    );
  }
  if (items.length) return items;

  const obj = source.match(/module\.exports\s*=\s*\{([^}]+)\}/);
  if (obj) {
    const names = obj[1]
      .split(",")
      .map((p) => p.trim().split(/[:]/)[0].trim())
      .filter((n) => n && /^[A-Za-z0-9_$]+$/.test(n));
    for (const name of names) {
      const fnRe = new RegExp(
        `(?:function\\s+${name}\\b|(?:const|let|var)\\s+${name}\\b)`,
        "m"
      );
      const m = source.match(fnRe);
      let doc = header;
      if (m && m.index != null) {
        const jsdoc = findPrecedingJsdoc(source, m.index);
        if (jsdoc && hasDocContent(jsdoc.doc)) doc = jsdoc.doc;
      }
      items.push(
        makeItem({
          name,
          fileRel,
          index: m?.index ?? obj.index,
          source,
          doc,
          kind: "module-export",
        })
      );
    }
  }

  if (!items.length && header) {
    const classMatch = source.match(/class\s+([A-Za-z0-9_$]+)/);
    if (classMatch) {
      items.push(
        makeItem({
          name: classMatch[1],
          fileRel,
          index: classMatch.index,
          source,
          doc: header,
          kind: "module",
        })
      );
    } else {
      const base = path.basename(fileRel, path.extname(fileRel));
      items.push(
        makeItem({
          name: base,
          fileRel,
          index: 0,
          source,
          doc: header,
          kind: "module",
        })
      );
    }
  }

  return items;
}

/** Extract exported symbols + adjacent JSDoc. Never synthesizes description text. */
export function extractExportsFromSource(source, fileRel) {
  let items = extractEsmExports(source, fileRel);
  if (!items.length && /module\.exports/.test(source)) {
    items = extractCommonJsExports(source, fileRel);
  }
  if (!items.length && !/export\s/.test(source)) {
    items = extractCommonJsExports(source, fileRel);
  }
  return items.sort((a, b) => a.line - b.line);
}

/**
 * Presentational demo allowlist only (no Firebase/edit-mode).
 * Values are demo ids registered in packages/docs.
 */
export const DEMO_ALLOWLIST = {
  SocialIcon: "icons-social",
  FacebookIcon: "icons-social",
  InstagramIcon: "icons-social",
  iconColors: "icons-social",
  WaveTop: "waves",
  WaveBottom: "waves",
  Swoosh: "waves",
  FloatingIsland: "floating-island",
  ThreeDots: "three-dots",
};

export function attachDemos(items) {
  for (const item of items) {
    if (DEMO_ALLOWLIST[item.name]) {
      item.demoId = DEMO_ALLOWLIST[item.name];
    }
  }
  return items;
}
