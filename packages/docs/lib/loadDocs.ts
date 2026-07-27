import type {
  DocExport,
  ServerLegosCache,
  SitesCache,
  WebLegosCache,
} from "./types";

import webLegos from "../data/web-legos.json";
import webLegosApi from "../data/web-legos-api.json";
import serverLegos from "../data/server-legos.json";
import sites from "../data/sites.json";

export function getWebLegos(): WebLegosCache {
  return webLegos as WebLegosCache;
}

export function getWebLegosApi(): WebLegosCache {
  return webLegosApi as WebLegosCache;
}

export function getServerLegos(): ServerLegosCache {
  return serverLegos as ServerLegosCache;
}

export function getSites(): SitesCache {
  return sites as SitesCache;
}

export function findWebLego(slug: string): DocExport | undefined {
  const all = [...getWebLegos().exports, ...getWebLegosApi().exports];
  return all.find((e) => e.slug === slug);
}

export function allWebLegoSlugs(): string[] {
  return [...getWebLegos().exports, ...getWebLegosApi().exports].map(
    (e) => e.slug
  );
}
