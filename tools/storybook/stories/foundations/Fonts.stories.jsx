import { HarvestStatus, useSiteHarvest } from "../_support/usages.jsx";

/**
 * The typefaces WL sites render with, read from each live site (same loading as "On each site"):
 * which families carry how much of the text, whether each is a loaded web font or a system
 * fallback, and every text role (h1–h6, body, links, buttons, navigation) as the site styles it.
 */
export default {
  title: "Foundations/Fonts",
  parameters: { layout: "fullscreen", controls: { disable: true } },
};

const page = { fontFamily: "system-ui, sans-serif", color: "#11181c", padding: 24 };
const muted = { color: "#687076", fontSize: 13, margin: "0 0 12px" };
const card = { border: "1px solid #e6e8eb", borderRadius: 10, padding: 16, background: "#fff" };
const chip = { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#eceef0", marginRight: 4, marginTop: 4 };
const tag = (web) => ({ ...chip, background: web ? "#e8f4ec" : "#fff4e5", color: web ? "#1a7f37" : "#9a6700" });

/** Light text (white footers etc.) gets a dark backdrop so the sample is readable. */
function isLight(color) {
  const [r, g, b] = (color.match(/[\d.]+/g) || []).map(Number);
  if (![r, g, b].every(Number.isFinite)) return false;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.75;
}

function fontStack(family) {
  return `"${family}", system-ui, sans-serif`;
}

function Specimen({ family, webFont, sites }) {
  return (
    <div style={{ ...card, minWidth: 260, flex: "1 1 260px", maxWidth: 420 }}>
      <div style={{ fontFamily: fontStack(family), fontSize: 34, lineHeight: 1.15 }}>Aa Bb Gg 0123</div>
      <div style={{ fontFamily: fontStack(family), fontSize: 15, margin: "6px 0 10px" }}>The quick brown fox jumps over the lazy dog.</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{family}</div>
      <span style={tag(webFont)}>{webFont ? "web font" : "system / fallback"}</span>
      <div>{sites.map((s) => <span key={s} style={chip}>{s}</span>)}</div>
    </div>
  );
}

function short(style) {
  const size = parseFloat(style["font-size"]);
  const line = parseFloat(style["line-height"]);
  return [
    `${Math.round(size)}px`,
    style["font-weight"],
    Number.isFinite(line) ? `/${Math.round(line)}px` : "",
    style["font-style"] !== "normal" ? style["font-style"] : "",
    style["text-transform"] !== "none" ? style["text-transform"] : "",
    style["letter-spacing"] !== "normal" ? `tracking ${style["letter-spacing"]}` : "",
  ].filter(Boolean).join(" · ");
}

function SiteType({ label, typography }) {
  return (
    <section style={{ ...card, marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{label}</h2>
      <div style={{ marginBottom: 12 }}>
        {typography.families.slice(0, 6).map((f) => (
          <span key={f.family} style={tag(f.webFont)}>{f.family} {Math.round(f.share * 100)}%</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", gap: "10px 16px", alignItems: "baseline" }}>
        {typography.roles.map(({ role, style, family, sample }) => (
          <div key={role} style={{ display: "contents" }}>
            <div style={{ fontSize: 12, color: "#687076" }}>
              <div style={{ fontWeight: 600, color: "#11181c" }}>{role}</div>
              <div>{family}</div>
              <div>{short(style)}</div>
            </div>
            <div style={{ ...Object.fromEntries(Object.entries(style).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v])), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: isLight(style.color) ? "#2b2f33" : "transparent", padding: "2px 6px", borderRadius: 4 }}>
              {sample}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Fonts() {
  const sites = useSiteHarvest();
  const done = sites.filter((s) => s.status === "done" && s.typography);

  // Every family that carries at least 2% of some site's text, with the sites using it.
  const all = new Map();
  for (const s of done) {
    for (const f of s.typography.families) {
      if (f.share < 0.02) continue;
      if (!all.has(f.family)) all.set(f.family, { family: f.family, webFont: f.webFont, sites: [] });
      all.get(f.family).sites.push(s.site.label);
    }
  }
  const families = [...all.values()].sort((a, b) => b.sites.length - a.sites.length || a.family.localeCompare(b.family));

  return (
    <div style={page}>
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>Fonts</h1>
      <HarvestStatus sites={sites} />
      <h2 style={{ fontSize: 18, margin: "20px 0 10px" }}>Typefaces in use</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {families.map((f) => <Specimen key={f.family} {...f} />)}
      </div>
      <h2 style={{ fontSize: 18, margin: "28px 0 10px" }}>Type styles by site</h2>
      {done
        .sort((a, b) => a.site.label.localeCompare(b.site.label))
        .map((s) => <SiteType key={s.site.label} label={s.site.label} typography={s.typography} />)}
    </div>
  );
}

export const Overview = { name: "Fonts", render: () => <Fonts /> };
