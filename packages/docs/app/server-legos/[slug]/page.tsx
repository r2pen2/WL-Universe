import { notFound } from "next/navigation";
import { ComponentPage } from "@/components/ComponentPage";
import { getServerLegos } from "@/lib/loadDocs";

export function generateStaticParams() {
  return getServerLegos().modules.map((m) => ({ slug: m.slug }));
}

export default function ServerLegoModulePage({
  params,
}: {
  params: { slug: string };
}) {
  const mod = getServerLegos().modules.find((m) => m.slug === params.slug);
  if (!mod) notFound();

  return (
    <article>
      <h1 className="page-title">{mod.name}</h1>
      <p className="page-path">{mod.file}</p>

      {mod.header?.deprecated ? (
        <div className="banner-deprecated" role="status">
          <strong>@deprecated</strong>
          {mod.header.deprecated ? ` — ${mod.header.deprecated}` : null}
        </div>
      ) : null}

      {mod.headerText ? (
        <>
          <h2 style={{ fontFamily: "var(--docs-font-body)" }}>
            File header (source)
          </h2>
          <div className="source-cite">
            <pre>{mod.headerText}</pre>
          </div>
        </>
      ) : mod.undocumented ? (
        <div className="undocumented">No docstring in source</div>
      ) : null}

      {mod.header?.description && !mod.headerText ? (
        <div className="prose">{mod.header.description}</div>
      ) : null}

      <h2 style={{ fontFamily: "var(--docs-font-body)", marginTop: "1.75rem" }}>
        Exports
      </h2>
      {mod.exports.map((item) => (
        <div key={item.slug} style={{ marginBottom: "2rem" }}>
          <ComponentPage item={item} />
        </div>
      ))}
    </article>
  );
}
