#!/usr/bin/env node
/**
 * Generate ephemeral QA compose YAML for one app + PR.
 *
 *   node scripts/qa/generate-compose.mjs --pr 42 --app beyond-the-bell --owner r2pen2
 *   node scripts/qa/generate-compose.mjs --pr 42 --app beyond-the-bell --out /tmp/compose.yml
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_BY_NAME,
  imageName,
  qaContainerName,
  qaHostname,
  qaRouterName,
} from "./apps.mjs";

function parseArgs(argv) {
  const args = { pr: null, app: null, owner: "r2pen2", out: null, tag: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr" && argv[i + 1]) args.pr = String(argv[++i]);
    else if (a === "--app" && argv[i + 1]) args.app = argv[++i];
    else if (a === "--owner" && argv[i + 1]) args.owner = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (a === "--tag" && argv[i + 1]) args.tag = argv[++i];
  }
  if (!args.pr || !args.app) throw new Error("--pr and --app are required");
  if (!APP_BY_NAME[args.app]) throw new Error(`Unknown app: ${args.app}`);
  args.tag = args.tag || `pr-${args.pr}`;
  return args;
}

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function generateCompose({ pr, app, owner, tag }) {
  const entry = APP_BY_NAME[app];
  const container = qaContainerName(pr, app);
  const router = qaRouterName(pr, app);
  const host = qaHostname(pr, app);
  const image = `${imageName(owner, app)}:${tag}`;
  const envFile = `/opt/services/data/app-env/qa/${app}.env`;
  const assetsRoot = `/opt/services/data/app-assets/qa/pr-${pr}/${app}`;
  const port = String(entry.port);

  const volumes = [];
  if (entry.kind === "spa") {
    volumes.push(
      `      - ${assetsRoot}/static:/repo/packages/${app}/static`,
      `      - ${assetsRoot}/images:/repo/packages/${app}/images`,
      `      - ${assetsRoot}/serviceAccountKey.json:/repo/packages/${app}/config/serviceAccountKey.json:ro`,
    );
    if (entry.extraVolumes?.includes("cal")) {
      volumes.push(
        `      - ${assetsRoot}/cal.json:/repo/packages/${app}/config/cal.json:ro`,
      );
    }
  } else if (entry.kind === "express") {
    volumes.push(
      `      - ${assetsRoot}:/opt/services/data/app-assets/site-mail`,
    );
  }

  const environment =
    entry.kind === "express"
      ? [
          `      PORT: ${yamlQuote(port)}`,
          `      SITE_MAIL_LOG_DIR: /opt/services/data/app-assets/site-mail`,
          `      SITE_MAIL_DISABLE_SEND: ${yamlQuote("1")}`,
        ]
      : [`      PORT: ${yamlQuote(port)}`];

  return `services:
  ${app}:
    image: ${image}
    container_name: ${container}
    restart: "no"
    env_file:
      - ${envFile}
    environment:
${environment.join("\n")}
    volumes:
${volumes.join("\n")}
    networks:
      - proxy
    labels:
      com.centurylinklabs.watchtower.enable: "false"
      traefik.enable: "true"
      traefik.http.routers.${router}.rule: Host(\`${host}\`)
      traefik.http.routers.${router}.entrypoints: web
      traefik.http.services.${router}.loadbalancer.server.port: ${yamlQuote(port)}

networks:
  proxy:
    external: true
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const yaml = generateCompose(args);
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, yaml);
    console.log(args.out);
  } else {
    process.stdout.write(yaml);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
