import { useState } from "react";
import { Navbar } from "@nextui-org/react";
import { WLNav, WLNavBrandCenter, WLNavBrandLeft, WLNavSocials } from "../../../../packages/web-legos/components/Navigation.jsx";
import NavbarMinimal from "../../../../packages/web-legos/Layouts/Navigation/Navbars.jsx";
import logo from "../../../../packages/room01890/client/public/logo.png";

export default {
  title: "Web-Legos/Navigation",
  parameters: { site: "web-legos" },
};

const links = ["Home", "About", "Services", "Contact"];

function NavDemo() {
  const [active, setActive] = useState("Home");
  return (
    <WLNav>
      <WLNav.Left>
        <WLNavBrandLeft source={logo} imageSize={44} />
        <WLNavBrandCenter source={logo} imageSize={36} />
      </WLNav.Left>
      <Navbar.Content hideIn="md" gap={24}>
        {links.map((l) => (
          <Navbar.Link key={l} isActive={l === active} onClick={() => setActive(l)}>{l}</Navbar.Link>
        ))}
      </Navbar.Content>
      <WLNav.Right>
        <WLNavSocials>
          <WLNavSocials.Button platformKey="facebook" href="https://facebook.com" />
          <WLNavSocials.Button platformKey="instagram" href="https://instagram.com" />
        </WLNavSocials>
        <WLNav.Toggle aria-label="Open menu" />
      </WLNav.Right>
      <Navbar.Collapse>
        {links.map((l) => (
          <Navbar.CollapseItem key={l}>{l}</Navbar.CollapseItem>
        ))}
      </Navbar.Collapse>
    </WLNav>
  );
}

/** WLNav with brand, links, socials and the mobile hamburger (switch the viewport to Phone). */
export const Nav = { render: () => <NavDemo /> };

/** NavbarMinimal (web-legos Layouts). */
export const Minimal = {
  render: () => (
    <NavbarMinimal>
      {links.map((l) => (
        <NavbarMinimal.Item key={l} href="#">{l}</NavbarMinimal.Item>
      ))}
    </NavbarMinimal>
  ),
};
