import { FullSite } from "../../_support/site.jsx";

const load = () => import("../../../../../packages/a-new-day-coaching/client/src/index.js");

/** A New Day Coaching: written inline in the site's App/route, not a component. Shown in the full site, scrolled to it. */
export default {
  title: "Patterns/Footer/A New Day Coaching",
  parameters: { site: "a-new-day-coaching", fullSite: true, route: "/" },
};

export const Current = { render: () => <FullSite load={load} scrollTo={'footer'} /> };
