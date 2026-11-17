import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/boston-mixtape/client/src/index.js");

/** Boston Mixtape, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/Boston Mixtape",
  parameters: { site: "boston-mixtape", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
