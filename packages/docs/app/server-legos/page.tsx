import Link from "next/link";
import { getServerLegos } from "@/lib/loadDocs";

export default function ServerLegosIndexPage() {
  const { modules } = getServerLegos();

  return (
    <article>
      <h1 className="page-title">Server Legos</h1>
      <p className="section-lead">
        Modules under <code>packages/server-legos/*.js</code>. Headers and{" "}
        <code>@deprecated</code> notes are copied from source only.
      </p>
      <ul className="index-list">
        {modules.map((mod) => (
          <li key={mod.slug}>
            <Link href={`/server-legos/${mod.slug}/`}>
              <span>
                {mod.name}
                {mod.header?.deprecated ||
                mod.exports.some((e) => e.deprecated) ? (
                  <span className="badge warn" style={{ marginLeft: 8 }}>
                    deprecated
                  </span>
                ) : null}
              </span>
              <span className={`badge${mod.undocumented ? " muted" : ""}`}>
                {mod.undocumented ? "No docstring" : mod.file}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
