import { LineButton } from "../../../../packages/web-legos/components/Buttons.jsx";
import { ButtonRounded } from "../../../../packages/web-legos/Layouts/Buttons/Buttons.jsx";

/** Buttons from web-legos. Use the Controls panel to try colors and labels. */
export default {
  title: "UI elements/Buttons",
  parameters: { layout: "centered" },
};

/** ButtonRounded (Layouts/Buttons): a filled, rounded call-to-action. Used by Talk About Dreams. */
export const Rounded = {
  args: { children: "Speak With Me", color: "#5738B3", size: "lg" },
  argTypes: {
    color: { control: "color" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => <ButtonRounded {...args} onClick={() => {}} />,
};

/** LineButton: a button with a rule out to each side, for section headers. */
export const Line = {
  parameters: { layout: "padded" },
  args: { text: "Speak With Me", color: "#5738B3" },
  argTypes: { color: { control: "color" } },
  render: (args) => (
    <div style={{ width: 720 }}>
      <LineButton {...args} onClick={() => {}} />
    </div>
  ),
};
