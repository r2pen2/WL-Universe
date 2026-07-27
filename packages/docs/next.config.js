const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Served at https://wl-universe.joed.dev (apex of subdomain — no basePath)
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  // Allow importing presentational demos from packages/web-legos
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@web-legos": path.resolve(__dirname, "../web-legos"),
    };
    return config;
  },
};

module.exports = nextConfig;
