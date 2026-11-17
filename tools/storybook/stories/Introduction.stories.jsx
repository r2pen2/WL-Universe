export default {
  title: "Introduction",
  parameters: { layout: "padded", site: "web-legos" },
};

const section = { maxWidth: 760, fontFamily: "system-ui, sans-serif", lineHeight: 1.55, color: "#11181c" };

/** What's in the catalog and how to read it. */
export const About = {
  render: () => (
    <div style={section}>
      <h1 style={{ fontSize: 32 }}>WL component catalog</h1>
      <p>
        Every WL component, and every site's version of each repeated pattern, rendered from the real source in{" "}
        <code>packages/</code>, with each site&apos;s live content from the production CMS. The catalog&apos;s CMS key is
        read-only (the CMS refuses any change), and forms, mail and sign-in aren&apos;t connected, so nothing here can edit
        a site.
      </p>
      <h2 style={{ fontSize: 20 }}>Sections</h2>
      <ul>
        <li><b>Web-Legos</b>: the shared primitives (text, images, contact links, navigation, footer pieces, buttons, layouts).</li>
        <li><b>Patterns</b>: each site's current footer and contact form, one per site, so the duplication is visible side by side. These are the &quot;before&quot; pictures for the shared skins (WL-8, WL-9).</li>
        <li><b>Sites</b>: each whole site, rendered by its own <code>index.js</code>.</li>
      </ul>
      <h2 style={{ fontSize: 20 }}>Tips</h2>
      <ul>
        <li>Use the viewport toolbar (Phone / Tablet / Laptop / Desktop) to check responsiveness.</li>
        <li><b>Admin</b> stories show what a signed-in site admin sees (Request content changes, Site settings, editable elements). Saving there fails on purpose: the key is read-only.</li>
        <li>Switching between sites reloads the preview, so one site&apos;s global CSS never restyles another.</li>
      </ul>
    </div>
  ),
};
