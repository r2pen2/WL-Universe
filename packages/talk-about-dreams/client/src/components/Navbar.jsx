import React, { useState } from 'react'
import { Link, Navbar as NextUINavbar, Text } from "@nextui-org/react";
import {WLNavBrandLeft, WLNavContent} from "../libraries/Web-Legos/components/Navigation"

import logo from "../assets/images/logoTransparent.svg"
import { red600 } from '../assets/style/nextUiTheme';

export default function Navbar() {
  return (
    <NextUINavbar
      height="80px"
      variant="floating"
      maxWidth="lg"
      containerCss={{
        backgroundColor: "#070709",
      }}
    >
      <WLNavContent>
        <WLNavContent.Left>
          <NextUINavbar.Toggle className="d-flex d-xxl-none px-3" />
          <WLNavBrandLeft source={logo} title="Talk About Dreams" imageSize={60} />
        </WLNavContent.Left>
          <NavbarPages />
        <WLNavContent.Right>
        </WLNavContent.Right>
      </WLNavContent>
      <NextUINavbar.Collapse >
        {collapseItems.map((item, index) => (
          <NextUINavbar.CollapseItem key={index}>
            <Link
              color="inherit"
              css={{
                minWidth: "100%",
              }}
              href={item.href}
            >
              {item.name}
            </Link>
          </NextUINavbar.CollapseItem>
        ))}
      </NextUINavbar.Collapse>
    </NextUINavbar>
  )
}

const navbarItemFontSize = "20px";

const collapseItems = [
  {
    name: "Home",
    href: "/#dreams",
  },
  {
    name: "Who I Am",
    href: "/#julia",
  },
  {
    name: "Services",
    href: "/#services",
  },
  {
    name: "Insights",
    href: "/#insights",
  },
  {
    name: "Contact",
    href: "/#contact",
  },
];

function NavbarPages() {

  function checkLinkActive(route) {
    return activePage === route;
  }

  const [activePage, setActivePage] = useState("dreams")

  return (
    <NextUINavbar.Content enableCursorHighlight className='d-none d-xxl-flex flex-row align-items-center justify-content-end w-100 px-0'>
      <NextUINavbar.Link 
        onClick={() => setActivePage("dreams")}
        isActive={checkLinkActive("dreams")}
        href="/#dreams"
        itemCss={{fontSize: navbarItemFontSize}}
        className="px-2"
        >
        <Text b style={{color: (checkLinkActive("dreams") ? red600 : "#9ca1a5"), filter: (checkLinkActive("dreams") ? `drop-shadow(0px 0px 5px ${red600})` : "none")}}>
          Home
        </Text>
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        onClick={() => setActivePage("julia")}
        isActive={checkLinkActive("julia")}
        href="/#julia"
        itemCss={{fontSize: navbarItemFontSize}}
        className="px-2"
      >
        <Text b style={{color: (checkLinkActive("julia") ? red600 : "#9ca1a5"), filter: (checkLinkActive("julia") ? `drop-shadow(0px 0px 5px ${red600})` : "none")}}>
          Who I Am
        </Text>
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        onClick={() => setActivePage("services")}
        isActive={checkLinkActive("services")}
        href="/#services"
        itemCss={{fontSize: navbarItemFontSize}}
        className="px-2"
        >
        <Text b style={{color: (checkLinkActive("services") ? red600 : "#9ca1a5"), filter: (checkLinkActive("services") ? `drop-shadow(0px 0px 5px ${red600})` : "none")}}>
          Services
        </Text>
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        onClick={() => setActivePage("insights")}
        isActive={checkLinkActive("insights")}
        href="/#insights"
        itemCss={{fontSize: navbarItemFontSize}}
        className="px-2"
      >
        <Text b style={{color: (checkLinkActive("insights") ? red600 : "#9ca1a5"), filter: (checkLinkActive("insights") ? `drop-shadow(0px 0px 5px ${red600})` : "none")}}>
          Insights
        </Text>
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        onClick={() => setActivePage("contact")}
        isActive={checkLinkActive("contact")}
        href="/#contact"
        itemCss={{fontSize: navbarItemFontSize}}
        className="px-2"
      >
        <Text b style={{color: (checkLinkActive("contact") ? red600 : "#9ca1a5"), filter: (checkLinkActive("contact") ? `drop-shadow(0px 0px 5px ${red600})` : "none")}}>
          Contact
        </Text>
      </NextUINavbar.Link>
    </NextUINavbar.Content>
  )
}