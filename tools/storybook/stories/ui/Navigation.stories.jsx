import { useState } from "react";
import { Navbar } from "@nextui-org/react";
import { WLNav, WLNavBrandLeft, WLNavSocials } from "../../../../packages/web-legos/components/Navigation.jsx";
import logo from "../../../../packages/room01890/client/public/logo.png";
import { OnEachSite as Usages } from "../_support/usages.jsx";

/**
 * WLNav: the site navigation bar (NextUI Navbar) with WLNav.Left / WLNav.Right slots, a brand,
 * links, WLNavSocials and WLNav.Toggle, which opens the menu below the lg breakpoint.
 * Switch the viewport to Phone to see the mobile menu.
 */
export default {
  title: "UI elements/Navigation bar",
  globals: { viewport: { value: "desktop" } },
};

/** Every instance on the WL sites, as each site renders it, grouped into variants. */
export const OnEachSite = {
  name: "On each site",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: () => <Usages elements={["nav"]} />,
};

const LINKS = ["Home", "About", "Services", "Contact"];

function Nav({ height, socialsShowIn }) {
  const [active, setActive] = useState("Home");
  return (
    <WLNav height={height}>
      <WLNav.Left>
        <WLNavBrandLeft source={logo} imageSize={44} />
      </WLNav.Left>
      <Navbar.Content hideIn="xs" gap={24}>
        {LINKS.map((l) => (
          <Navbar.Link key={l} isActive={l === active} onClick={() => setActive(l)}>{l}</Navbar.Link>
        ))}
      </Navbar.Content>
      <WLNav.Right>
        <WLNavSocials showIn={socialsShowIn}>
          <WLNavSocials.Button platformKey="facebook" href="https://facebook.com" />
          <WLNavSocials.Button platformKey="instagram" href="https://instagram.com" />
        </WLNavSocials>
        <WLNav.Toggle aria-label="Open menu" />
      </WLNav.Right>
      <Navbar.Collapse>
        {LINKS.map((l) => (
          <Navbar.CollapseItem key={l}>{l}</Navbar.CollapseItem>
        ))}
      </Navbar.Collapse>
    </WLNav>
  );
}

export const NavigationBar = {
  name: "Navigation bar",
  args: { height: "80px", socialsShowIn: "md" },
  argTypes: { socialsShowIn: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "xxl"], description: "WLNavSocials showIn: the breakpoint the social buttons appear at (default xxl)" } },
  render: (args) => <Nav {...args} />,
};
