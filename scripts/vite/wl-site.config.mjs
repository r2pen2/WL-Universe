/**
 * The one Vite config for every WL site client (packages/<site>/client) and the Storybook catalog.
 *
 * Each site's vite.config.mjs is the same three lines: it imports Vite and the plugins (so they
 * resolve from the site's own node_modules, which is all a Docker build has) and hands them here.
 *
 *   import * as vite from "vite";
 *   import react from "@vitejs/plugin-react";
 *   import svgr from "vite-plugin-svgr";
 *   import { wlSiteConfig } from "../../../scripts/vite/wl-site.config.mjs";
 *   export default wlSiteConfig({ vite, react, svgr });
 *
 * It keeps the Create React App conventions the sites were written against, so no site code
 * changes: JSX in .js files, `import url, { ReactComponent } from "./x.svg"`, REACT_APP_* env vars
 * read through process.env, PostCSS only where CRA applied it, and output in build/.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * CRA lets .js files contain JSX; Vite (Oxc) only parses JSX in .jsx/.tsx. Compile the sites' own
 * .js files as JSX before anything else sees them. Fast Refresh still covers the .jsx components.
 */
export function jsInJsxPlugin(vite) {
  let isProduction = false;
  return {
    name: "wl-js-as-jsx",
    enforce: "pre",
    configResolved(config) {
      isProduction = config.isProduction;
    },
    async transform(code, id) {
      const file = id.split("?")[0];
      if (!file.endsWith(".js") || file.includes("/node_modules/")) return null;
      // Vite 8 compiles with Oxc; the catalog's Vite 7 with esbuild.
      const result = vite.transformWithOxc
        ? await vite.transformWithOxc(code, file, { lang: "jsx", jsx: { runtime: "automatic", development: !isProduction } })
        : await vite.transformWithEsbuild(code, file, { loader: "jsx", jsx: "automatic" });
      return { code: result.code, map: result.map };
    },
  };
}

/**
 * CRA's SVG imports: the default export is the file URL and `ReactComponent` is the SVG as a
 * component (`import logo, { ReactComponent as Logo } from "./logo.svg"`). Needs vite-plugin-svgr.
 */
export function craSvgPlugin() {
  return {
    name: "wl-cra-svg",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!/\.svg$/.test(source) || !importer || importer.startsWith("\0cra-svg:")) return null;
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      return resolved ? `\0cra-svg:${resolved.id}` : null;
    },
    load(id) {
      if (!id.startsWith("\0cra-svg:")) return null;
      const file = JSON.stringify(id.slice("\0cra-svg:".length));
      return `import url from ${file.slice(0, -1)}?url"; export default url; export { default as ReactComponent } from ${file.slice(0, -1)}?react";`;
    },
  };
}

/**
 * CRA (webpack) let a source file be CommonJS, e.g. the CRM's api/db/userDefaults.js, which its
 * Express server also require()s. `vite build` (Rolldown) bundles CommonJS on its own, but the dev
 * server serves sources as native ESM, so wrap such files there: `module.exports` becomes the
 * default export, and a `module.exports = { a, b }` literal also gives named exports.
 */
export function cjsSourcePlugin() {
  return {
    name: "wl-cjs-source",
    apply: "serve",
    transform(code, id) {
      const file = id.split("?")[0];
      if (!/\.[cm]?js$/.test(file) || file.includes("/node_modules/")) return null;
      if (!/\bmodule\.exports\b/.test(code) || /^\s*(import|export)\s/m.test(code)) return null;
      const literal = code.match(/module\.exports\s*=\s*\{([^}]*)\}\s*;?\s*$/);
      const names = literal
        ? literal[1].split(",").map((n) => n.trim()).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n))
        : [];
      // A shorthand literal (`{ a, b }`) names locals of the same name: export those.
      const named = names.length ? `\nexport { ${names.join(", ")} };` : "";
      return {
        code: `const module = { exports: {} }; const exports = module.exports;\n${code}\nexport default module.exports;${named}`,
        map: null,
      };
    },
  };
}

/** The CRA-compatibility plugins, shared with the Storybook catalog. */
export function craCompatPlugins({ vite, svgr }) {
  return [craSvgPlugin(), svgr(), jsInJsxPlugin(vite), cjsSourcePlugin()];
}

/**
 * CRA inlined `process.env` as an object of NODE_ENV, PUBLIC_URL and every REACT_APP_* variable
 * (from the environment or .env files). web-legos reads them dynamically (`process.env[name]`),
 * so define the whole object the same way.
 */
function processEnv(vite, mode, root) {
  const fromFiles = vite.loadEnv(mode, root, "REACT_APP_");
  const fromShell = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("REACT_APP_")));
  const nodeEnv = mode === "production" ? "production" : "development";
  return { NODE_ENV: nodeEnv, PUBLIC_URL: "", ...fromFiles, ...fromShell };
}

/**
 * CRA ignored postcss.config.* files: it ran its own PostCSS (autoprefixer for the package.json
 * browserslist, plus Tailwind when tailwind.config.js exists). Do the same, inline, so the stray
 * Mantine postcss configs some sites carry stay unused, exactly as before.
 */
function postcssPlugins(root) {
  const siteRequire = createRequire(path.join(root, "package.json"));
  const plugins = [];
  const hasTailwind = ["tailwind.config.js", "tailwind.config.cjs", "tailwind.config.mjs"].some((f) => fs.existsSync(path.join(root, f)));
  if (hasTailwind) plugins.push(siteRequire("tailwindcss"));
  plugins.push(siteRequire("autoprefixer"));
  return plugins;
}

/**
 * The Vite config for a WL site client. Run from the client directory (npm scripts do).
 * @param {object} deps - `{ vite, react, svgr }`, imported by the site's vite.config.mjs
 */
export function wlSiteConfig({ vite, react, svgr }) {
  return vite.defineConfig(({ mode }) => {
    const root = process.cwd();
    const env = processEnv(vite, mode, root);
    return {
      root,
      plugins: [...craCompatPlugins({ vite, svgr }), react({ include: /\.(js|jsx|ts|tsx)$/ })],
      define: {
        "process.env": JSON.stringify(env),
        "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
      },
      css: { postcss: { plugins: postcssPlugins(root) } },
      optimizeDeps: {
        // Let the dependency scanner read the sites' JSX-in-.js sources.
        rolldownOptions: { moduleTypes: { ".js": "jsx" } },
      },
      server: {
        // scripts/dev/client.mjs sets PORT per site, as it did for CRA.
        port: Number(process.env.PORT) || 3000,
        open: false,
        fs: { allow: [path.resolve(here, "../..")] },
      },
      preview: { port: Number(process.env.PORT) || 4173 },
      build: {
        // Same output folder as CRA: the Dockerfiles and Express servers serve client/build.
        outDir: "build",
        emptyOutDir: true,
        chunkSizeWarningLimit: 4096,
      },
      // `npm test` (Vitest) for the sites that have tests: jsdom, Jest-style globals, and the
      // site's own src/setupTests.js. The synced web-legos copy (src/libraries) isn't the site's.
      test: {
        environment: "jsdom",
        globals: true,
        include: ["src/**/*.test.{js,jsx,ts,tsx}"],
        exclude: ["**/node_modules/**", "src/libraries/**"],
        setupFiles: [
          path.join(here, "vitest-setup.mjs"),
          ...["src/setupTests.js", "src/setupTests.ts"].filter((f) => fs.existsSync(path.join(root, f))),
        ],
      },
    };
  });
}
