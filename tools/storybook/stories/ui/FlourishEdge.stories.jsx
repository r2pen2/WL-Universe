import { WLFlourishEdge } from "../../../../packages/web-legos/components/Decoration.jsx";

/**
 * WLFlourishEdge (components/Decoration): a soft arch with a quiet baroque scroll, capping the top
 * of a section so the edge between two sections isn't a hard line. It overlaps the section above.
 * Use the Controls panel to try colors and sizes.
 */
export default {
  title: "UI elements/Flourish edge",
  parameters: { layout: "fullscreen" },
  args: { color: "#ffffff", accent: "#a67fcf", height: 64, ornamentWidth: 360 },
  argTypes: {
    color: { control: "color" },
    accent: { control: "color" },
    height: { control: { type: "range", min: 32, max: 160, step: 4 } },
    ornamentWidth: { control: { type: "range", min: 160, max: 720, step: 10 } },
  },
};

/** You Can Do It Gardening: under the homepage hero, above Jess's section. */
export const Default = {
  render: (args) => (
    <div>
      <div style={{ height: 320, background: "linear-gradient(160deg, #7f97e8 0%, #b9c9f4 50%, #dfe9a8 100%)" }} />
      <WLFlourishEdge {...args} />
      <div style={{ height: 240, background: args.color }} />
    </div>
  ),
};
