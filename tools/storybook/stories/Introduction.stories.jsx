export default {
  title: "Introduction",
  parameters: { layout: "padded" },
};

const section = { maxWidth: 760, fontFamily: "system-ui, sans-serif", lineHeight: 1.55, color: "#11181c" };

/** What's in the catalog and how it's organized. */
export const Introduction = {
  name: "Introduction",
  render: () => (
    <div style={section}>
      <h1 style={{ fontSize: 32 }}>WL component catalog</h1>
      <p>
        The building blocks WL sites are made of, from the real source in <code>packages/</code>, with live content from
        the production CMS. The catalog&apos;s CMS key is read-only and forms, mail and sign-in aren&apos;t connected, so
        nothing here can change a site.
      </p>
      <h2 style={{ fontSize: 20 }}>Hierarchy</h2>
      <ul>
        <li><b>Foundations</b>: icons.</li>
        <li><b>UI elements</b>: reusable pieces (buttons, social buttons, contact links, admin login, footer pieces, navigation bar). Use the Controls panel to try props.</li>
        <li><b>Admin menus</b>: what a signed-in admin opens (Site settings, Request content changes).</li>
        <li><b>Layouts</b>: ready-made sections in web-legos.</li>
        <li><b>CMS elements</b>: reference for the editable text and image elements.</li>
        <li><b>Patterns</b>: each site&apos;s current footer and contact form, one per site, to compare before they share one implementation with skins.</li>
        <li><b>Sites</b>: each whole site.</li>
      </ul>
      <p>Use the viewport toolbar (Phone / Tablet / Laptop / Desktop) to check responsiveness.</p>
    </div>
  ),
};
