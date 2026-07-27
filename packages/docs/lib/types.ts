export type DocParam = {
  name: string | null;
  type: string | null;
  description: string;
};

export type DocExport = {
  name: string;
  slug: string;
  kind: string;
  file: string;
  line: number;
  description: string | null;
  params: DocParam[];
  defaults: string | null;
  deprecated: string | null;
  links: string[];
  see: string | null;
  returns: string | null;
  undocumented: boolean;
  demoId: string | null;
};

export type WebLegosCache = {
  package: string;
  generatedAt: string;
  rule: string;
  exports: DocExport[];
};

export type ServerModule = {
  name: string;
  slug: string;
  file: string;
  headerText: string | null;
  header: {
    description: string | null;
    deprecated: string | null;
    params: DocParam[];
    defaults: string | null;
    links: string[];
  } | null;
  exports: DocExport[];
  undocumented: boolean;
};

export type ServerLegosCache = {
  package: string;
  generatedAt: string;
  rule: string;
  modules: ServerModule[];
};

export type SiteCache = {
  app: string;
  slug: string;
  productSpecific: boolean;
  label: string;
  generatedAt: string;
  exports: DocExport[];
};

export type SitesCache = {
  generatedAt: string;
  rule: string;
  apps: string[];
  sites: Record<string, SiteCache>;
};
