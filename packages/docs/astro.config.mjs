import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://wl-universe.joed.dev",
  integrations: [
    starlight({
      title: "WL-Universe",
      description:
        "Component reference indexed from existing JSDoc — no invented prose.",
      social: {
        github: "https://github.com/r2pen2/WL-Universe",
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        { label: "Overview", link: "/" },
        {
          label: "Web Legos",
          autogenerate: { directory: "web-legos" },
        },
        {
          label: "Server Legos",
          autogenerate: { directory: "server-legos" },
        },
        {
          label: "Site assets",
          autogenerate: { directory: "sites" },
        },
      ],
      pagination: true,
      lastUpdated: false,
    }),
  ],
});
