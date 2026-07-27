const path = require("path");

/** @type {import('next').NextConfig} */
const repoName = "WL-Universe";

const nextConfig = {
  output: "export",
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
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
