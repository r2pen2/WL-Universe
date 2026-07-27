import { notFound } from "next/navigation";
import Link from "next/link";
import { getSites } from "@/lib/loadDocs";

export function generateStaticParams() {
  return getSites().apps.map((app) => ({ app }));
}

export default function SiteAppPage({
  params,
}: {
  params: { app: string };
}) {
  const data = getSites();
  const site = data.sites[params.app];
  if (!site) notFound();

  return (
    <article>
      <p className="section-lead" style={{ marginBottom: "0.5rem" }}>
        <Link href="/sites/">Sites</Link>
      </p>
      <h1 className="page-title">{site.app}</h1>
      <p className="section-lead">{site.label}</p>

      <ul className="index-list">
        {site.exports.map((item) => (
          <li key={item.slug}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.65rem 0.2rem",
                borderBottom: "1px solid var(--docs-border)",
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div className="page-path" style={{ margin: 0 }}>
                  {item.file}:{item.line}
                </div>
                {item.undocumented || !item.description ? (
                  <div className="undocumented" style={{ marginTop: 8 }}>
                    No docstring in source
                  </div>
                ) : (
                  <div className="prose" style={{ marginTop: 8 }}>
                    {item.description}
                  </div>
                )}
                {item.deprecated ? (
                  <div className="banner-deprecated" style={{ marginTop: 8 }}>
                    <strong>@deprecated</strong>
                    {item.deprecated ? ` — ${item.deprecated}` : null}
                  </div>
                ) : null}
              </div>
              <span className={`badge${item.undocumented ? " muted" : ""}`}>
                {item.undocumented ? "No docstring" : "JSDoc"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
