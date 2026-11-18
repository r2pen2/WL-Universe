import { useEffect, useState } from "react";

/**
 * "On each site": every instance of a UI element as it actually renders on each WL site.
 *
 * Each site's Sites/ story is loaded in a hidden same-origin iframe (1440px wide, `wlHarvest=1` so
 * preview.jsx doesn't reload it). Once the page settles, the instances are found (web-legos marks
 * its elements with data-wl / .wl-contact classes) and copied into this page with every computed
 * style inlined, so they look exactly as on the site without bringing the site's CSS along.
 * Identical instances are grouped. Links that do the same job without the WL component (a
 * hand-written mailto:, a social link that isn't a SocialButton) are listed separately.
 *
 * One pass collects every element for a site; results are kept for the life of the preview page,
 * so moving between UI element stories doesn't reload the sites.
 */

const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "youtube.com", "linkedin.com", "tiktok.com", "twitter.com", "x.com/", "pinterest.com", "spotify.com", "soundcloud.com"];

export const ELEMENTS = {
  socialButtons: {
    title: "Social buttons",
    wl: '[data-wl="social-button"]',
    other: SOCIAL_HOSTS.map((h) => `a[href*="${h}"]`).join(","),
    otherLabel: "Social links that aren't a SocialButton",
    describe: (el) => [el.getAttribute("data-wl-variant") && `${el.getAttribute("data-wl-variant")} button`, el.getAttribute("data-wl-platform")].filter(Boolean).join(" · "),
  },
  email: { title: "Email addresses", wl: ".wl-contact--email", other: 'a[href^="mailto:"]', otherLabel: "mailto: links that aren't WLEmailAddress" },
  phone: { title: "Phone numbers", wl: ".wl-contact--phone", other: 'a[href^="tel:"]', otherLabel: "tel: links that aren't WLPhoneNumber" },
  address: {
    title: "Street addresses",
    wl: ".wl-contact--address",
    other: 'a[href*="google.com/maps"],a[href*="maps.google."],a[href*="maps.app.goo.gl"]',
    otherLabel: "Map links that aren't WLStreetAddress",
  },
  adminLogin: { title: "Admin login", wl: '[aria-label="admin-login-button"]' },
  footerLogo: { title: "Footer logo (WLFooterLogo)", wl: '[data-wl="footer-logo"]' },
  copyright: { title: "Copyright line (WLCopyright)", wl: '[data-wl="copyright"]' },
  developerCredit: {
    title: "Developer credit (WLFooterSignature)",
    wl: '[data-wl="developer-credit"]',
    other: 'a[href*="joed.dev"]',
    otherLabel: "Credits written by hand",
  },
  nav: {
    title: "Navigation bar (WLNav)",
    wl: '[data-wl="nav"]',
    other: "nav, header",
    otherLabel: "Navigation bars that aren't WLNav",
    // Site navigation only: not pagination, not link rows in the footer.
    otherFilter: (el) => !el.closest("footer") && !/pagination/i.test(`${el.getAttribute("aria-label") || ""} ${el.className || ""}`) && el.querySelectorAll("a[href]").length >= 2 && !el.parentElement.closest("nav, header"),
  },
};

const WL_ANY = Object.values(ELEMENTS).map((e) => e.wl).join(",");
const WIDTH = 1440;
const CONCURRENCY = 3;

// ------------------------------------------------------------------ copying with styles

function isTransparent(color) {
  return !color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color);
}

/** The color behind an element: the nearest ancestor's background. */
function backdrop(el, win) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const cs = win.getComputedStyle(node);
    if (!isTransparent(cs.backgroundColor)) return cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== "none") return "#7d7d7d";
  }
  return "#ffffff";
}

function inlineStyles(source, target, win, root) {
  const cs = win.getComputedStyle(source);
  let css = "";
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    css += `${prop}:${cs.getPropertyValue(prop)};`;
  }
  // Scroll-in animations can leave things at opacity 0 offscreen.
  if (cs.opacity === "0") css += "opacity:1;";
  if (root) css += "position:relative;inset:auto;margin:0;transform:none;";
  target.setAttribute("style", css);
  for (const attr of ["id", "class", "aria-describedby", "aria-labelledby", "tabindex", "data-testid"]) target.removeAttribute(attr);
}

/** The element as HTML with every computed style inlined, or null when it isn't shown. */
function styledCopy(el, win) {
  if (win.getComputedStyle(el).display === "contents") {
    const parts = [...el.children].map((child) => styledCopy(child, win)).filter(Boolean);
    return parts.length ? parts.join("") : null;
  }
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const copy = el.cloneNode(true);
  const from = [el, ...el.querySelectorAll("*")];
  const to = [copy, ...copy.querySelectorAll("*")];
  from.forEach((node, i) => inlineStyles(node, to[i], win, i === 0));
  copy.querySelectorAll("script, noscript, iframe").forEach((node) => node.remove());
  // Relative image URLs resolve against the site page.
  copy.querySelectorAll("img[src]").forEach((img, i) => img.setAttribute("src", from.filter((n) => n.tagName === "IMG")[i]?.currentSrc || img.src));
  return copy.outerHTML;
}

/** @font-face rules and font stylesheets the site loaded, so copied text keeps its typeface. */
function fontsOf(doc) {
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).filter((href) => !href.startsWith(window.location.origin));
  const faces = [];
  for (const sheet of doc.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules) if (rule.constructor.name === "CSSFontFaceRule") faces.push(rule.cssText);
  }
  return { links, faces };
}

function collect(doc, win) {
  const found = {};
  for (const [key, def] of Object.entries(ELEMENTS)) {
    const take = (el, kind) => {
      const html = styledCopy(el, win);
      const label = def.describe ? def.describe(el) : "";
      return html ? { html, kind, label, background: backdrop(el, win) } : { hidden: true, kind };
    };
    const wl = [...doc.querySelectorAll(def.wl)].map((el) => take(el, "wl"));
    const other = def.other
      ? [...doc.querySelectorAll(def.other)].filter((el) => !el.closest(WL_ANY) && !el.querySelector(WL_ANY) && (!def.otherFilter || def.otherFilter(el))).map((el) => take(el, "other"))
      : [];
    found[key] = [...wl, ...other];
  }
  return found;
}

// ------------------------------------------------------------------ loading the sites

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function count(doc) {
  return Object.values(ELEMENTS).reduce((n, def) => n + doc.querySelectorAll(def.other ? `${def.wl},${def.other}` : def.wl).length, 0);
}

async function harvestSite(site) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  Object.assign(frame.style, { position: "fixed", left: "-20000px", top: "0", width: `${WIDTH}px`, height: "1000px", border: "0" });
  frame.src = `iframe.html?id=${encodeURIComponent(site.id)}&viewMode=story&wlHarvest=1`;
  document.body.appendChild(frame);
  try {
    await new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    // Wait for the site to render (the preview compiles it first, which takes a while when several
    // load at once), then for the CMS content: until nothing new has appeared for a few seconds.
    const loadStarted = Date.now();
    while (Date.now() - loadStarted < 60000 && (doc.body?.innerText || "").trim().length < 200) await wait(500);
    const started = Date.now();
    let last = -1;
    let stableSince = Date.now();
    let scrolled = false;
    while (Date.now() - started < 30000) {
      await wait(500);
      if (!scrolled && Date.now() - started > 4000) {
        // Trigger anything that only renders when scrolled into view.
        scrolled = true;
        const height = doc.documentElement.scrollHeight;
        for (let y = 0; y < height; y += 800) {
          win.scrollTo(0, y);
          await wait(60);
        }
        win.scrollTo(0, 0);
      }
      const n = count(doc);
      if (n !== last) {
        last = n;
        stableSince = Date.now();
      } else if (scrolled && Date.now() - stableSince > 2500) break;
    }
    return { found: collect(doc, win), fonts: fontsOf(doc) };
  } finally {
    frame.remove();
  }
}

let sitesPromise = null;
const results = new Map();
const listeners = new Set();

async function siteStories() {
  const index = await fetch("index.json").then((r) => r.json());
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story" && entry.title.startsWith("Sites/"))
    .map((entry) => ({ id: entry.id, label: entry.title.slice("Sites/".length) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function installFonts({ links, faces }) {
  for (const href of links) {
    if (document.querySelector(`link[data-wl-usage-font="${CSS.escape(href)}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.wlUsageFont = href;
    document.head.appendChild(link);
  }
  let style = document.getElementById("wl-usage-fonts");
  if (!style) {
    style = document.createElement("style");
    style.id = "wl-usage-fonts";
    document.head.appendChild(style);
  }
  const have = new Set(style.textContent.split("\n"));
  const add = faces.filter((face) => !have.has(face));
  if (add.length) style.textContent += `${add.join("\n")}\n`;
}

/** Load every site once (a few at a time) and keep what was found. */
function startHarvest() {
  if (sitesPromise) return sitesPromise;
  sitesPromise = siteStories().then(async (sites) => {
    sites.forEach((site) => results.set(site.label, { site, status: "loading" }));
    listeners.forEach((l) => l());
    const queue = [...sites];
    const worker = async () => {
      for (let site = queue.shift(); site; site = queue.shift()) {
        try {
          const { found, fonts } = await harvestSite(site);
          installFonts(fonts);
          results.set(site.label, { site, status: "done", found });
        } catch (err) {
          results.set(site.label, { site, status: "error", error: String(err && err.message ? err.message : err) });
        }
        listeners.forEach((l) => l());
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return sites;
  });
  return sitesPromise;
}

function useHarvest() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    startHarvest();
    return () => listeners.delete(listener);
  }, []);
  return [...results.values()];
}

// ------------------------------------------------------------------ view

const page = { fontFamily: "system-ui, sans-serif", color: "#11181c", padding: 24 };
const h2 = { fontSize: 18, margin: "28px 0 4px" };
const muted = { color: "#687076", fontSize: 13, margin: "0 0 12px" };
const chip = { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#eceef0", marginRight: 4, marginTop: 4 };

function group(entries, kind) {
  const groups = new Map();
  for (const { site, item } of entries) {
    if (item.kind !== kind || item.hidden) continue;
    const key = `${item.background}|${item.html}`;
    if (!groups.has(key)) groups.set(key, { ...item, sites: new Map() });
    const g = groups.get(key);
    g.sites.set(site, (g.sites.get(site) || 0) + 1);
  }
  // Same kind together (e.g. every facebook button), then by site.
  return [...groups.values()].sort((x, y) => {
    const byPlatform = (x.label.split(" · ").pop() || "").localeCompare(y.label.split(" · ").pop() || "");
    return byPlatform || x.label.localeCompare(y.label) || [...x.sites.keys()][0].localeCompare([...y.sites.keys()][0]);
  });
}

function Variant({ variant, warn }) {
  return (
    <figure style={{ margin: 0, border: `1px solid ${warn ? "#f5a524" : "#e6e8eb"}`, borderRadius: 10, overflow: "hidden", maxWidth: "100%" }}>
      <div style={{ background: variant.background, padding: 16, overflow: "auto", maxWidth: "100%" }}>
        <div style={{ display: "inline-block", pointerEvents: "none" }} dangerouslySetInnerHTML={{ __html: variant.html }} />
      </div>
      <figcaption style={{ padding: "6px 10px 8px", fontSize: 12, background: "#fff" }}>
        {variant.label && <div style={{ color: "#687076", marginBottom: 2 }}>{variant.label}</div>}
        {[...variant.sites].map(([site, n]) => (
          <span key={site} style={chip}>{site}{n > 1 ? ` ×${n}` : ""}</span>
        ))}
      </figcaption>
    </figure>
  );
}

function Section({ def, entries }) {
  const wl = group(entries, "wl");
  const other = group(entries, "other");
  const hidden = entries.filter((e) => e.item.hidden).length;
  const usedOn = new Set(entries.filter((e) => e.item.kind === "wl").map((e) => e.site));
  const grid = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" };
  return (
    <section>
      <h2 style={h2}>{def.title}</h2>
      <p style={muted}>
        {wl.length} variant{wl.length === 1 ? "" : "s"} on {usedOn.size} site{usedOn.size === 1 ? "" : "s"}
        {hidden ? ` · ${hidden} more not visible at ${WIDTH}px (hidden at this width or in a closed menu)` : ""}
      </p>
      <div style={grid}>{wl.map((v, i) => <Variant key={i} variant={v} />)}</div>
      {other.length > 0 && (
        <>
          <p style={{ ...muted, marginTop: 16, color: "#9a6700" }}>{def.otherLabel}: {other.length}</p>
          <div style={grid}>{other.map((v, i) => <Variant key={i} variant={v} warn />)}</div>
        </>
      )}
    </section>
  );
}

/** Every instance of `elements` (keys of ELEMENTS) across the WL sites, grouped into variants. */
export function OnEachSite({ elements }) {
  const sites = useHarvest();
  const pending = sites.filter((s) => s.status === "loading");
  const failed = sites.filter((s) => s.status === "error");
  return (
    <div style={page}>
      <p style={muted}>
        As rendered on each site at {WIDTH}px, from live prod content.
        {pending.length ? ` Loading ${pending.map((s) => s.site.label).join(", ")}…` : sites.length ? ` All ${sites.length} sites loaded.` : " Loading sites…"}
        {failed.map((s) => ` ${s.site.label} failed: ${s.error}.`)}
      </p>
      {elements.map((key) => {
        const entries = sites
          .filter((s) => s.status === "done")
          .flatMap((s) => (s.found[key] || []).map((item) => ({ site: s.site.label, item })));
        return <Section key={key} def={ELEMENTS[key]} entries={entries} />;
      })}
    </div>
  );
}
