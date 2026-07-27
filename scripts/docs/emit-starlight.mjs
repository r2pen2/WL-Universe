/**
 * Emit Starlight markdown from extract JSON. Copies source JSDoc only.
 * Uses .md (not .mdx) so JSDoc generics like {@link Foo} / Array<string> do not break MDX.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DOCS = path.join(ROOT, "packages/docs");
const DATA = path.join(DOCS, "data");
const CONTENT = path.join(DOCS, "src/content/docs");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function rimrafGenerated(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function yamlString(value) {
  if (value == null || value === "") return '""';
  const s = String(value).replace(/\n/g, " ");
  return JSON.stringify(s);
}

function writePage(relPath, body) {
  const full = path.join(CONTENT, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, body);
}

function propsTable(params) {
  if (!params?.length) return "";
  const rows = params
    .map((p) => {
      const name = (p.name || "—").replace(/\|/g, "\\|");
      const type = (p.type || "—").replace(/\|/g, "\\|");
      const desc = (p.description || "—").replace(/\|/g, "\\|").replace(/\n/g, " ");
      return `| \`${name}\` | \`${type}\` | ${desc} |`;
    })
    .join("\n");
  return `
## Props / params

| Name | Type | Description |
|------|------|-------------|
${rows}
`;
}

function demoHtml(demoId) {
  if (demoId === "icons-social") {
    return `
## Live demo

<div class="demo-slot">
  <h3>Live demo</h3>
  <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
    <svg role="img" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    <svg role="img" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path fill="#E4405F" d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
    <svg role="img" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><title>Youtube</title><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  </div>
</div>
`;
  }
  if (demoId === "three-dots") {
    return `
## Live demo

<div class="demo-slot">
  <h3>Live demo</h3>
  <div style="max-width:320px;display:flex;justify-content:space-between;padding:0.5rem 0">
    <div style="display:flex;gap:0.5rem">
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
    </div>
    <div style="display:flex;gap:0.5rem">
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#0f5c4c"></div>
    </div>
  </div>
</div>
`;
  }
  if (demoId === "floating-island") {
    return `
## Live demo

<div class="demo-slot">
  <h3>Live demo</h3>
  <div style="padding:1rem 0;background:#1c1a16;border-radius:6px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:1rem;width:70%;margin:0 auto">
      <div style="width:100%;height:0.25rem;background:#d8ebe4"></div>
      <div style="width:80%;height:0.25rem;background:#d8ebe4"></div>
      <div style="width:60%;height:0.25rem;background:#d8ebe4"></div>
      <div style="width:40%;height:0.25rem;background:#d8ebe4"></div>
    </div>
  </div>
</div>
`;
  }
  if (demoId === "waves") {
    return `
## Live demo

<div class="demo-slot">
  <h3>Live demo</h3>
  <p><em>Presentational wave components — see source SVG in <code>Waves.jsx</code>.</em></p>
  <div style="background:#0f5c4c;border-radius:6px;height:48px;margin-bottom:0.75rem"></div>
  <div style="background:#1c1a16;border-radius:6px;height:48px;margin-bottom:0.75rem"></div>
  <div style="background:#d8ebe4;border-radius:6px;height:48px"></div>
</div>
`;
  }
  return "";
}

function exportPage(item) {
  const parts = [];
  parts.push("---");
  parts.push(`title: ${yamlString(item.name)}`);
  parts.push("---");
  parts.push("");
  parts.push(`\`${item.file}:${item.line}\``);
  parts.push("");

  if (item.deprecated) {
    parts.push(`> **@deprecated** — ${item.deprecated}`);
    parts.push("");
  }

  if (item.undocumented || !item.description) {
    parts.push("**No docstring in source**");
  } else {
    parts.push(item.description);
  }
  parts.push("");

  if (item.see) {
    parts.push(`\`@see\` ${item.see}`);
    parts.push("");
  }

  parts.push(propsTable(item.params));

  if (item.defaults) {
    parts.push("## @default");
    parts.push("");
    parts.push("```");
    parts.push(item.defaults);
    parts.push("```");
    parts.push("");
  }

  if (item.demoId) {
    parts.push(demoHtml(item.demoId));
  }

  return parts.join("\n");
}

function siteAssetsPage(site) {
  const parts = [];
  parts.push("---");
  parts.push(`title: ${yamlString(site.app)}`);
  parts.push(
    `description: ${yamlString(site.label || "Site-specific component assets")}`
  );
  parts.push("---");
  parts.push("");
  parts.push(site.label || "Site-specific components");
  parts.push("");
  if (site.productSpecific) {
    parts.push("> Product-specific (CRM) — **not** shared web-legos.");
    parts.push("");
  }
  parts.push("## Assets");
  parts.push("");
  parts.push("Each row is an export found under `client/src/components`.");
  parts.push("");
  parts.push("| Asset | File | Docstring |");
  parts.push("|-------|------|-----------|");

  for (const item of site.exports) {
    const doc =
      item.undocumented || !item.description
        ? "No docstring in source"
        : item.description.replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 160);
    parts.push(
      `| **${item.name}** | \`${item.file}:${item.line}\` | ${doc} |`
    );
  }
  parts.push("");

  for (const item of site.exports) {
    parts.push(`### ${item.name}`);
    parts.push("");
    parts.push(`\`${item.file}:${item.line}\``);
    parts.push("");
    if (item.deprecated) {
      parts.push(`> **@deprecated** — ${item.deprecated}`);
      parts.push("");
    }
    if (item.undocumented || !item.description) {
      parts.push("**No docstring in source**");
    } else {
      parts.push(item.description);
    }
    parts.push("");
    if (item.params?.length) parts.push(propsTable(item.params));
  }

  return parts.join("\n");
}

function serverModulePage(mod) {
  const parts = [];
  parts.push("---");
  parts.push(`title: ${yamlString(mod.name)}`);
  parts.push("---");
  parts.push("");
  parts.push(`\`${mod.file}\``);
  parts.push("");

  if (mod.header?.deprecated) {
    parts.push(`> **@deprecated** — ${mod.header.deprecated}`);
    parts.push("");
  }

  if (mod.headerText) {
    parts.push("## File header (source)");
    parts.push("");
    parts.push("```js");
    parts.push(mod.headerText);
    parts.push("```");
    parts.push("");
  } else if (mod.undocumented) {
    parts.push("**No docstring in source**");
    parts.push("");
  }

  for (const item of mod.exports) {
    parts.push(`### ${item.name}`);
    parts.push("");
    parts.push(`\`${item.file}:${item.line}\``);
    parts.push("");
    if (item.deprecated) {
      parts.push(`> **@deprecated** — ${item.deprecated}`);
      parts.push("");
    }
    if (item.undocumented || !item.description) {
      parts.push("**No docstring in source**");
    } else {
      parts.push(item.description);
    }
    parts.push("");
    if (item.params?.length) parts.push(propsTable(item.params));
  }

  return parts.join("\n");
}

export function emitStarlight() {
  const webLegos = JSON.parse(
    fs.readFileSync(path.join(DATA, "web-legos.json"), "utf8")
  );
  const webApi = JSON.parse(
    fs.readFileSync(path.join(DATA, "web-legos-api.json"), "utf8")
  );
  const server = JSON.parse(
    fs.readFileSync(path.join(DATA, "server-legos.json"), "utf8")
  );
  const sites = JSON.parse(fs.readFileSync(path.join(DATA, "sites.json"), "utf8"));

  rimrafGenerated(path.join(CONTENT, "web-legos"));
  rimrafGenerated(path.join(CONTENT, "server-legos"));
  rimrafGenerated(path.join(CONTENT, "sites"));

  writePage(
    "web-legos/index.mdx",
    `---
title: Web Legos
description: Shared components and layouts from packages/web-legos
---

Extracted from \`packages/web-legos/components\`, \`Layouts\`, and \`api\`. Descriptions are copied from source JSDoc only.

Use the sidebar to open a component. Undocumented exports still appear and say **No docstring in source**.
`
  );

  const used = new Set();
  function uniqueSlug(slug) {
    let s = slug;
    let n = 2;
    while (used.has(s)) {
      s = `${slug}-${n++}`;
    }
    used.add(s);
    return s;
  }

  for (const item of webLegos.exports) {
    writePage(`web-legos/${uniqueSlug(item.slug)}.md`, exportPage(item));
  }
  for (const item of webApi.exports) {
    writePage(`web-legos/${uniqueSlug(`api-${item.slug}`)}.md`, exportPage(item));
  }

  writePage(
    "server-legos/index.mdx",
    `---
title: Server Legos
description: Express modules under packages/server-legos
---

Modules under \`packages/server-legos\`. Headers and \`@deprecated\` notes are copied from source only.
`
  );

  for (const mod of server.modules) {
    writePage(`server-legos/${mod.slug}.md`, serverModulePage(mod));
  }

  for (const app of sites.apps) {
    const site = sites.sites[app];
    writePage(`sites/${site.slug}.md`, siteAssetsPage(site));
  }

  console.log(
    `Starlight pages: web-legos ${webLegos.exports.length + webApi.exports.length}, server ${server.modules.length}, site asset pages ${sites.apps.length}`
  );
}
