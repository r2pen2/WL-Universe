import type { DocExport } from "@/lib/types";
import { DemoSlot } from "@/demos/DemoSlot";

export function ComponentPage({ item }: { item: DocExport }) {
  return (
    <article>
      <h1 className="page-title">{item.name}</h1>
      <p className="page-path">
        {item.file}:{item.line}
      </p>

      {item.deprecated ? (
        <div className="banner-deprecated" role="status">
          <strong>@deprecated</strong>
          {item.deprecated ? ` — ${item.deprecated}` : null}
        </div>
      ) : null}

      {item.undocumented || !item.description ? (
        <div className="undocumented">No docstring in source</div>
      ) : (
        <div className="prose">{item.description}</div>
      )}

      {item.see ? (
        <p className="section-lead">
          <code>@see</code> {item.see}
        </p>
      ) : null}

      {item.params && item.params.length > 0 ? (
        <>
          <h2 style={{ fontFamily: "var(--docs-font-body)", marginTop: "1.75rem" }}>
            Props / params
          </h2>
          <table className="props-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {item.params.map((p, i) => (
                <tr key={`${p.name}-${i}`}>
                  <td>
                    <code>{p.name || "—"}</code>
                  </td>
                  <td>
                    <code>{p.type || "—"}</code>
                  </td>
                  <td>{p.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {item.defaults ? (
        <>
          <h2 style={{ fontFamily: "var(--docs-font-body)" }}>@default</h2>
          <div className="source-cite">
            <pre>{item.defaults}</pre>
          </div>
        </>
      ) : null}

      {item.demoId ? <DemoSlot demoId={item.demoId} /> : null}
    </article>
  );
}
