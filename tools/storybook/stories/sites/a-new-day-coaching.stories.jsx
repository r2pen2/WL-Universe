import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/a-new-day-coaching/client/src/index.js");

/** A New Day Coaching, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/A New Day Coaching",
  parameters: { site: "a-new-day-coaching", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
