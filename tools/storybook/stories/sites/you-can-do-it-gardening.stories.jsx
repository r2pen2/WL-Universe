import { FullSite } from "../_support/site.jsx";
import GardenDrift from "../../../../packages/you-can-do-it-gardening/client/src/components/GardenDrift.jsx";
import { WLFlourishEdge } from "../../../../packages/web-legos/components/Decoration.jsx";
import "../../../../packages/you-can-do-it-gardening/client/src/assets/style/homepage.css";

const load = () => import("../../../../packages/you-can-do-it-gardening/client/src/index.js");

/** You Can Do It Gardening, rendered by its own src/index.js with live prod content (read-only). Switch viewports to compare. */
export default {
  title: "Sites/You Can Do It Gardening",
  parameters: { site: "you-can-do-it-gardening", fullSite: true, route: "/" },
};

export const Default = { name: "You Can Do It Gardening", render: () => <FullSite load={load} htmlId="root-element" /> };

/** The homepage hero's falling leaves and flowers on their own: the real `.background-image` hero, without the content, capped by the flourish edge of the section below. */
export const LeavesAndFlowersStory = {
  name: "Leaves and flowers",
  parameters: { fullSite: false, route: undefined },
  render: () => (
    <>
      <div className="background-image" style={{ height: 600 }}>
        <GardenDrift />
      </div>
      <WLFlourishEdge />
      <div style={{ height: 200 }} />
    </>
  ),
};
