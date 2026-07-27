import Link from "next/link";
import { getWebLegos, getWebLegosApi } from "@/lib/loadDocs";

export default function WebLegosIndexPage() {
  const components = getWebLegos().exports;
  const api = getWebLegosApi().exports;
  const documented = components.filter((e) => !e.undocumented);
  const undocumented = components.filter((e) => e.undocumented);

  return (
    <article>
      <h1 className="page-title">Web Legos</h1>
      <p className="section-lead">
        Extracted from <code>packages/web-legos/components</code>,{" "}
        <code>Layouts</code>, and <code>api</code>. Descriptions are copied from
        source JSDoc only.
      </p>

      <h2 style={{ fontFamily: "var(--docs-font-body)" }}>
        Components ({documented.length} documented / {undocumented.length}{" "}
        undocumented)
      </h2>
      <ul className="index-list">
        {components.map((item) => (
          <li key={item.slug}>
            <Link href={`/web-legos/${item.slug}/`}>
              <span>
                {item.name}
                {item.deprecated ? (
                  <span className="badge warn" style={{ marginLeft: 8 }}>
                    deprecated
                  </span>
                ) : null}
              </span>
              <span className={`badge${item.undocumented ? " muted" : ""}`}>
                {item.undocumented ? "No docstring" : item.file.split("/").pop()}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 style={{ fontFamily: "var(--docs-font-body)", marginTop: "2rem" }}>
        API ({api.length})
      </h2>
      <ul className="index-list">
        {api.map((item) => (
          <li key={item.slug}>
            <Link href={`/web-legos/${item.slug}/`}>
              <span>{item.name}</span>
              <span className={`badge${item.undocumented ? " muted" : ""}`}>
                {item.undocumented ? "No docstring" : item.file.split("/").pop()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
