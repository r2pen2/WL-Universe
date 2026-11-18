// web-legos' tests (`npm test`) run with the same Vite config every WL site builds with:
// scripts/vite/wl-site.config.mjs.
import * as vite from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { wlSiteConfig } from "../../scripts/vite/wl-site.config.mjs";

export default wlSiteConfig({ vite, react, svgr });
