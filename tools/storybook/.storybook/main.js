import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import fs from "node:fs";
import * as vite from "vite";
import { craCompatPlugins } from "../../../scripts/vite/wl-site.config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const rootModules = path.join(repoRoot, "node_modules");
const webLegos = path.join(repoRoot, "packages", "web-legos");

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  stories: ["../stories/**/*.stories.@(js|jsx)"],
  framework: { name: "@storybook/react-vite", options: {} },
  addons: [],
  // A placeholder /wl-config.js; the deployed container overwrites it with the real settings.
  staticDirs: ["./static"],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [
        {
          // `virtual:wl-site-fonts`: each site's web-font <link>s from its index.html, so
          // stories render in the site's real fonts.
          name: "wl-site-fonts",
          resolveId: (id) => (id === "virtual:wl-site-fonts" ? "\0wl-site-fonts" : null),
          load(id) {
            if (id !== "\0wl-site-fonts") return null;
            const fonts = {};
            for (const site of fs.readdirSync(path.join(repoRoot, "packages"))) {
              const html = path.join(repoRoot, "packages", site, "client", "index.html");
              if (!fs.existsSync(html)) continue;
              const links = [...fs.readFileSync(html, "utf8").matchAll(/<link[^>]+href="([^"]+)"[^>]*>/g)]
                .filter((m) => /rel="stylesheet"/.test(m[0]) && /fonts|webfonts/.test(m[1]))
                .map((m) => m[1]);
              if (links.length) fonts[site] = links;
            }
            return `export default ${JSON.stringify(fonts)};`;
          },
        },
        // The same CRA-compatibility plugins every site builds with (scripts/vite/wl-site.config.mjs):
        // CRA-style SVG imports and JSX in .js files.
        ...craCompatPlugins({ vite, svgr }),
        react({ include: /\.(js|jsx|ts|tsx)$/ }),
      ],
      resolve: {
        alias: [
          // Sites import web-legos through their synced copy (src/libraries/Web-Legos, gitignored);
          // point those imports at the one real package so the catalog always shows current source.
          { find: /^(?:\.\.?\/)+(?:[^'"]*\/)?libraries\/Web-Legos\//, replacement: `${webLegos}/` },
          // One React for everything (the sites' and web-legos' React lives in the root node_modules).
          { find: /^react$/, replacement: path.join(rootModules, "react") },
          { find: /^react\/(.*)$/, replacement: path.join(rootModules, "react") + "/$1" },
          { find: /^react-dom$/, replacement: path.join(rootModules, "react-dom") },
          { find: /^react-dom\/(.*)$/, replacement: path.join(rootModules, "react-dom") + "/$1" },
        ],
        dedupe: ["react", "react-dom"],
      },
      optimizeDeps: {
        esbuildOptions: { loader: { ".js": "jsx" } },
        // Pre-bundle what the sites share up front: discovering these mid-session makes Vite re-optimize
        // and can leave two copies of a package on the page (e.g. two @firebase/app instances).
        include: [
          "firebase/app",
          "firebase/auth",
          "firebase/firestore",
          "firebase/storage",
          "@nextui-org/react",
          "@mantine/core",
          "@mantine/hooks",
          "react-router-dom",
          "@mui/material",
          "@mui/icons-material",
          "@emotion/react",
          "@emotion/styled",
        ],
      },
      define: { "process.env": "{}" },
      server: { fs: { allow: [repoRoot] } },
    });
  },
};
