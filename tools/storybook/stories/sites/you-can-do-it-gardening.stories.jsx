import { FullSite } from "../_support/site.jsx";

const load = () => import("../../../../packages/you-can-do-it-gardening/client/src/index.js");

/** You Can Do It Gardening, rendered by its own src/index.js with live prod content (read-only). Switch viewports to compare. */
export default {
  title: "Sites/You Can Do It Gardening",
  parameters: { site: "you-can-do-it-gardening", fullSite: true, route: "/" },
};

export const Default = { name: "You Can Do It Gardening", render: () => <FullSite load={load} htmlId="root-element" /> };
