import type { Metadata } from "next";
import { DocsShell } from "@/components/DocsShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "WL-Universe Docs",
  description:
    "Component reference indexed from existing JSDoc in web-legos, server-legos, and site packages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
