import { SocialIcon, platformKeys } from "../../../../packages/web-legos/components/Icons.jsx";

/**
 * Every icon web-legos ships (`SocialIcon platformKey=...`; also exported as FacebookIcon, MailIcon, ...).
 * Brand icons keep their brand color; contact icons (calendar, location, mail, phone) take the text color.
 */
export default {
  title: "Foundations/Icons",
  parameters: { layout: "padded" },
};

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, 120px)", gap: 20, fontFamily: "system-ui", fontSize: 12 };

function Grid({ color, size = 40, background, textColor }) {
  return (
    <div style={{ ...grid, background, color: textColor, padding: background ? 20 : 0, borderRadius: 12 }}>
      {Object.entries(platformKeys).map(([name, key]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <SocialIcon platformKey={key} size={size} color={color} />
          <code>{key}</code>
        </div>
      ))}
    </div>
  );
}

export const All = { render: () => <Grid /> };

export const OnDark = { render: () => <Grid background="#1e1e1e" textColor="#f4fbfc" /> };

/** One color for all (the `color` prop), e.g. to match a site's palette. */
export const SingleColor = {
  args: { color: "#5738B3", size: 32 },
  argTypes: { color: { control: "color" }, size: { control: { type: "range", min: 16, max: 96 } } },
  render: (args) => <Grid {...args} />,
};
