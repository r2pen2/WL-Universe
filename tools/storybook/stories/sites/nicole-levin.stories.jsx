import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/nicole-levin/client/src/index.js");

/** Nicole Levin, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/Nicole Levin",
  parameters: { site: "nicole-levin", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
