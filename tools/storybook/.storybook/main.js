import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { transformWithEsbuild } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const rootModules = path.join(repoRoot, "node_modules");
const webLegos = path.join(repoRoot, "packages", "web-legos");

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  stories: ["../stories/**/*.stories.@(js|jsx)"],
  framework: { name: "@storybook/react-vite", options: {} },
  addons: [],
  // Snapshot of each site's CMS image files (scripts/snapshot-cms.mjs), served where the mock CMS's
  // asset URLs point: <origin>/mock-cms/assets/<site>/images/<file>.
  staticDirs: [{ from: "../fixtures/cms-assets", to: "/mock-cms/assets" }],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [
        {
          // CRA's SVG imports: the default export is the file URL and `ReactComponent` is the SVG as a
          // component (`import logo, { ReactComponent as Logo } from "./logo.svg"`).
          name: "wl-cra-svg",
          enforce: "pre",
          async resolveId(source, importer) {
            if (!/\.svg$/.test(source) || !importer) return null;
            const resolved = await this.resolve(source, importer, { skipSelf: true });
            return resolved ? `\0cra-svg:${resolved.id}` : null;
          },
          load(id) {
            if (!id.startsWith("\0cra-svg:")) return null;
            const file = JSON.stringify(id.slice("\0cra-svg:".length));
            return `import url from ${file.slice(0, -1)}?url"; export default url; export { default as ReactComponent } from ${file.slice(0, -1)}?react";`;
          },
        },
        svgr(),
        {
          // CRA lets .js files contain JSX; compile those as JSX before anything else sees them.
          name: "wl-js-as-jsx",
          enforce: "pre",
          async transform(code, id) {
            if (!/\.js$/.test(id) || id.includes("node_modules")) return null;
            return transformWithEsbuild(code, id, { loader: "jsx", jsx: "automatic" });
          },
        },
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
