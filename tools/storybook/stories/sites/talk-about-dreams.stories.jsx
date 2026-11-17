import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/talk-about-dreams/client/src/index.js");

/** Talk About Dreams, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/Talk About Dreams",
  parameters: { site: "talk-about-dreams", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
