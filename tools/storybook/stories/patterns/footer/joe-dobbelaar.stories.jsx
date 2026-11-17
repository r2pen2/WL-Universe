import { FullSite } from "../../_support/site.jsx";

const load = () => import("../../../../../packages/joe-dobbelaar/client/src/index.js");

/** Joe Dobbelaar: written inline in the site's App/route, not a component. Shown in the full site, scrolled to it. */
export default {
  title: "Patterns/Footer/Joe Dobbelaar",
  parameters: { site: "joe-dobbelaar", fullSite: true, route: "/" },
};

export const Default = { name: "Joe Dobbelaar", render: () => <FullSite load={load} scrollTo={'footer'} /> };
