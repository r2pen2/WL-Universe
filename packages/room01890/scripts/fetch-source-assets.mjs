/**
 * Downloads the room01890.com (Wix) source assets this rebuild uses:
 *   - photos (resized to <=1920px, the same cap WLImageV2 uploads use) -> source-assets/images/
 *   - the logo -> client/src/assets/images/logo.png
 *   - every icon/glyph the source pages inline as SVG -> source-assets/icons/ and client/src/assets/icons/
 *
 *   node packages/room01890/scripts/fetch-source-assets.mjs
 *
 * Re-running overwrites the files. The CMS image ids are in client/src/content.js.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGES, LOGO_MEDIA } from "../client/src/content.js";

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = (...p) => path.join(pkg, ...p);
const UA = { "User-Agent": "Mozilla/5.0 (asset fetch)" };

async function get(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log(`${path.relative(pkg, file)} (${Math.round(data.length / 1024)} KB)`);
}

// Photos: Wix's fit transform keeps the aspect ratio and re-encodes as JPEG.
for (const img of IMAGES) {
  const url = `https://static.wixstatic.com/media/${img.media}/v1/fit/w_1920,h_1920,q_90,enc_jpg/${img.fileName}`;
  write(out("source-assets", "images", img.fileName), await get(url));
}

// Logo: shown at ~115px wide, so a 480px PNG is plenty (the original is 778 KB).
write(
  out("client", "src", "assets", "images", "logo.png"),
  await get(`https://static.wixstatic.com/media/${LOGO_MEDIA}/v1/fit/w_480,h_480,q_95,enc_png/logo.png`),
);

// Glyphs: inline <svg>s on the two pages, identified by the control they sit in.
const GLYPHS = [
  // [page, index among the page's <svg>s, file name]. "button-animated" is the 99 KB animated
  // arrow Wix ships in its buttons (not visible on this site); kept in source-assets only.
  ["/", 1, "scroll-left"],
  ["/", 2, "scroll-right"],
  ["/", 3, "menu"],
  ["/", 4, "button-animated"],
  ["/", 7, "gallery-prev"],
  ["/", 8, "gallery-next"],
  ["/", 9, "close"],
  ["/", 12, "dropdown-chevron"],
  ["/", 13, "facebook"],
  ["/", 14, "instagram"],
  ["/", 15, "youtube"],
  ["/", 16, "x"],
  ["/", 17, "linkedin"],
  ["/", 18, "tiktok"],
  ["/book-online", 5, "breadcrumb-chevron"],
];
const pages = {};
for (const [page, index, name] of GLYPHS) {
  pages[page] ??= (await get(`https://www.room01890.com${page}`)).toString("utf8").match(/<svg\b[\s\S]*?<\/svg>/g);
  let svg = pages[page][index];
  if (!svg) throw new Error(`No svg #${index} on ${page}`);
  // Kept as served (the animated glyph's own <style> uses its ids/classes); standalone files only
  // need the namespace.
  if (!/^<svg[^>]*\sxmlns=/.test(svg)) svg = svg.replace(/^<svg\b/, `<svg xmlns="http://www.w3.org/2000/svg"`);
  const data = Buffer.from(svg.trim() + "\n");
  write(out("source-assets", "icons", `${name}.svg`), data);
  if (name !== "button-animated") write(out("client", "src", "assets", "icons", `${name}.svg`), data);
}
