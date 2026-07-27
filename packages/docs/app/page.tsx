import Link from "next/link";

export default function HomePage() {
  return (
    <article>
      <h1 className="page-title">WL-Universe</h1>
      <p className="section-lead">
        Browsable index of existing JSDoc / TSDoc / file headers from the monorepo.
        Missing docs show as “No docstring in source” — nothing is invented here.
      </p>
      <ul className="index-list">
        <li>
          <Link href="/web-legos/">
            <span>Web Legos</span>
            <span className="badge">components + api</span>
          </Link>
        </li>
        <li>
          <Link href="/server-legos/">
            <span>Server Legos</span>
            <span className="badge">Express modules</span>
          </Link>
        </li>
        <li>
          <Link href="/sites/">
            <span>Sites</span>
            <span className="badge">per-app inventory</span>
          </Link>
        </li>
      </ul>
    </article>
  );
}
