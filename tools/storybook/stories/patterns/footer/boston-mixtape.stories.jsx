import { FullSite } from "../../_support/site.jsx";

const load = () => import("../../../../../packages/boston-mixtape/client/src/index.js");

/** Boston Mixtape: written inline in the site's App/route, not a component. Shown in the full site, scrolled to it. */
export default {
  title: "Patterns/Footer/Boston Mixtape",
  parameters: { site: "boston-mixtape", fullSite: true, route: "/" },
};

export const Default = { name: "Boston Mixtape", render: () => <FullSite load={load} scrollTo={'footer'} /> };
