"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  {
    title: "Overview",
    links: [{ href: "/", label: "Home" }],
  },
  {
    title: "Web Legos",
    links: [{ href: "/web-legos/", label: "Components" }],
  },
  {
    title: "Server Legos",
    links: [{ href: "/server-legos/", label: "Modules" }],
  },
  {
    title: "Sites",
    links: [{ href: "/sites/", label: "Site inventory" }],
  },
];

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  function isCurrent(href: string) {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname === href || pathname.startsWith(href);
  }

  return (
    <div className="docs-shell">
      <div
        className={`docs-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside className={`docs-sidebar${open ? " open" : ""}`}>
        <Link href="/" className="docs-brand" onClick={() => setOpen(false)}>
          WL-Universe
        </Link>
        <div className="docs-brand-sub">Component reference</div>
        {NAV.map((section) => (
          <nav key={section.title} className="docs-nav-section">
            <h2>{section.title}</h2>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </aside>
      <div className="docs-main">
        <button
          type="button"
          className="docs-mobile-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          Menu
        </button>
        {children}
      </div>
    </div>
  );
}
