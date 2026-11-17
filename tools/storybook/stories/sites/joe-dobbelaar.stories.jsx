import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/joe-dobbelaar/client/src/index.js");

/** Joe Dobbelaar, rendered by its own src/index.js against the CMS snapshot. Switch viewports to compare. */
export default {
  title: "Sites/Joe Dobbelaar",
  parameters: { site: "joe-dobbelaar", fullSite: true, route: "/" },
};

export const Home = { render: () => <FullSite load={load} /> };
