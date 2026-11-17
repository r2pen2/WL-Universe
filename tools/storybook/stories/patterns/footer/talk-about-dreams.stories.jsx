import { FullSite } from "../../_support/site.jsx";

const load = () => import("../../../../../packages/talk-about-dreams/client/src/index.js");

/** Talk About Dreams: written inline in the site's App/route, not a component. Shown in the full site, scrolled to it. */
export default {
  title: "Patterns/Footer/Talk About Dreams",
  parameters: { site: "talk-about-dreams", fullSite: true, route: "/" },
};

export const Current = { render: () => <FullSite load={load} scrollTo={'footer'} /> };
