import Link from "next/link";
import { getSites } from "@/lib/loadDocs";

export default function SitesIndexPage() {
  const { apps, sites } = getSites();

  return (
    <article>
      <h1 className="page-title">Sites</h1>
      <p className="section-lead">
        Per-app components under <code>packages/*/client/src/components</code>.
        These are <strong>not</strong> shared web-legos. CRM is labeled
        product-specific.
      </p>
      <ul className="index-list">
        {apps.map((app) => {
          const site = sites[app];
          return (
            <li key={app}>
              <Link href={`/sites/${app}/`}>
                <span>{app}</span>
                <span className="badge">
                  {site.productSpecific
                    ? "CRM / product-specific"
                    : `${site.exports.length} exports`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
