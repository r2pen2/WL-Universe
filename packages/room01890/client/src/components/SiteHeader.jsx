import { useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Navbar } from "@nextui-org/react";
import { WLNav } from "../libraries/Web-Legos/components/Navigation.jsx";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/book-online", label: "Book Online" },
];

/** Scrolls to #contact, also when the URL already ends in #contact (React Router won't re-fire then). */
export function useScrollToContact() {
  const { pathname, hash } = useLocation();
  return () => {
    if (pathname === "/" && hash === "#contact") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }
  };
}

/**
 * Site header: grey bar with centered page links and the "Inquiry" button (desktop); a hamburger
 * that opens the web-legos/NextUI collapse menu (below lg).
 */
export function SiteHeader() {
  const scrollToContact = useScrollToContact();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  /** Close the mobile menu after a link is chosen (the NextUI toggle owns the open state). */
  function closeMenu() {
    if (menuOpen) headerRef.current?.querySelector(".r01-header__toggle")?.click();
  }

  return (
    <div ref={headerRef} className="r01-header-wrap">
      <WLNav height="71px" variant="sticky" className="r01-header" disableShadow>
        <WLNav.Left>
          <span className="r01-header__spacer" />
        </WLNav.Left>

        <nav aria-label="Site" className="r01-header__links d-none d-lg-flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="r01-header__link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <WLNav.Right>
          <Link to="/#contact" onClick={scrollToContact} className="r01-button r01-button--ink r01-header__cta d-none d-lg-inline-flex">
            Inquiry
          </Link>
          <WLNav.Toggle className="r01-header__toggle" aria-label="Open site navigation" onChange={setMenuOpen} />
        </WLNav.Right>

        <Navbar.Collapse className="r01-menu">
          {LINKS.map((link) => (
            <Navbar.CollapseItem key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className="r01-menu__link"
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            </Navbar.CollapseItem>
          ))}
          <Navbar.CollapseItem>
            <Link
              to="/#contact"
              className="r01-menu__link"
              onClick={() => {
                closeMenu();
                scrollToContact();
              }}
            >
              Inquiry
            </Link>
          </Navbar.CollapseItem>
        </Navbar.Collapse>
      </WLNav>
    </div>
  );
}
