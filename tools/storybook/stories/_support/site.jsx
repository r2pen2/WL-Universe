import { useEffect, useRef, useState } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { createTheme, MantineProvider } from "@mantine/core";
import { MemoryRouter } from "react-router-dom";
import { AuthenticationManager } from "../../../../packages/web-legos/api/auth.ts";

const STORY_ADMIN = { uid: "storybook-admin", displayName: "Storybook Admin", email: "admin@example.com" };

/**
 * A stand-in AuthenticationManager: no Firebase, no popups. `admin` makes the story's user a
 * signed-in site admin (Request changes, Site settings, editable WL elements).
 */
export function fakeAuthManager({ admin = false } = {}) {
  const user = admin ? STORY_ADMIN : null;
  return {
    auth: {
      currentUser: user,
      onAuthStateChanged(callback) {
        callback(user);
        return () => {};
      },
    },
    initialize() {},
    async signInWithGoogle() {
      return user;
    },
    async createNewUser() {
      return 200;
    },
    async getPermission() {
      return admin;
    },
    async getPermissions() {
      return admin ? { op: true, siteText: true, siteImages: true } : {};
    },
    async isSiteAdmin() {
      return admin;
    },
    async requestContentChange() {
      return { identifier: "WL-0", url: "https://plane.joed.dev/" };
    },
  };
}

/**
 * Render a site component inside the contexts its App normally provides.
 * @param {object} contexts - { signIn: CurrentSignInContext, auth?: the site's own auth context }
 * @param {object} theme - the site's NextUI theme; `mantine` wraps in MantineProvider (true or a theme)
 *   Sites read the auth manager from AuthenticationManager.Context (shared) or their own context.
 */
export function SiteContexts({ contexts, admin, theme, mantine, children }) {
  const [currentSignIn, setCurrentSignIn] = useState(admin ? STORY_ADMIN : null);
  const [authenticationManager] = useState(() => fakeAuthManager({ admin }));
  const authValue = { authenticationManager };
  // Site components link with react-router; inside the catalog they get an in-memory router.
  let tree = <NextUIProvider theme={theme}><MemoryRouter>{children}</MemoryRouter></NextUIProvider>;
  if (mantine) tree = <MantineProvider theme={createTheme(mantine === true ? {} : mantine)}>{tree}</MantineProvider>;
  if (contexts.auth) tree = <contexts.auth.Provider value={authValue}>{tree}</contexts.auth.Provider>;
  tree = <AuthenticationManager.Context.Provider value={authValue}>{tree}</AuthenticationManager.Context.Provider>;
  tree = <contexts.signIn.Provider value={{ currentSignIn, setCurrentSignIn }}>{tree}</contexts.signIn.Provider>;
  return tree;
}

/** Shows a component at a fixed width inside the canvas, for side-by-side comparisons. */
export function Frame({ label, children, width }) {
  return (
    <section style={{ marginBottom: 32 }}>
      {label && <p style={{ font: "600 12px system-ui", letterSpacing: ".04em", textTransform: "uppercase", color: "#687076", margin: "0 0 8px 16px" }}>{label}</p>}
      <div style={{ width: width || "100%", outline: "1px dashed #c1c8cd" }}>{children}</div>
    </section>
  );
}

/**
 * Mounts a whole site exactly as production does: its own src/index.js renders into #root with the
 * site's providers and global CSS. `load` is that site's `() => import(".../src/index.js")`.
 * `scrollTo` (a CSS selector) scrolls to a section once it renders, e.g. the footer.
 */
export function FullSite({ load, scrollTo, htmlId }) {
  const ref = useRef(null);
  useEffect(() => {
    // Some sites style their own <html id="..."> from public/index.html.
    if (htmlId) document.documentElement.id = htmlId;
    load();
    if (!scrollTo) return undefined;
    let tries = 0;
    const timer = setInterval(() => {
      const nodes = document.querySelectorAll(scrollTo);
      const el = nodes[nodes.length - 1];
      if (el || ++tries > 40) {
        clearInterval(timer);
        if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 1500);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [load, scrollTo, htmlId]);
  return <div id="root" ref={ref} />;
}
