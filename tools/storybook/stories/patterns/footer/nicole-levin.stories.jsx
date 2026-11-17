import { FullSite } from "../../_support/site.jsx";

const load = () => import("../../../../../packages/nicole-levin/client/src/index.js");

/** Nicole Levin: written inline in the site's App/route, not a component. Shown in the full site, scrolled to it. */
export default {
  title: "Patterns/Footer/Nicole Levin",
  parameters: { site: "nicole-levin", fullSite: true, route: "/" },
};

export const Current = { render: () => <FullSite load={load} scrollTo={'footer'} /> };
