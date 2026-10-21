// Library Imports
import React from 'react';
import { Navbar as NextUINavbar, Button, Text, Image, Link } from "@nextui-org/react";

import { iconFills } from './Icons';

import { callLink, facebookLink, mapsLink, mailLink } from '../api/links';

import { iconColors } from "../libraries/Web-Legos/components/Icons";

import logoBlack from "../assets/images/logoTransparentBlack.png";

// Style Imports
import "../assets/style/navbar.css";
import "../assets/style/layout.css";
import { WLNav, WLNavBrandCenter, WLNavBrandLeft, WLNavSocials } from '../libraries/Web-Legos/components/Navigation';
import { platformKeys } from '../libraries/Web-Legos/components/Icons';

const navbarItemFontSize = "20px";

export function NavbarPages() {

  function checkLinkActive(route) {
    const location = window.location.pathname;
    if (route === "home" && window.location.pathname.length < 2) {
      return true;
    }
    return location.includes(route);
  }

  return (
    <NextUINavbar.Content enableCursorHighlight activeColor="primary" className="d-none d-lg-flex flex-row justify-content-end px-2">
      <NextUINavbar.Link 
        isActive={checkLinkActive("home")}
        href="home"
        itemCss={{fontSize: navbarItemFontSize}}
        className="mx-1"
        css={{display: "inline-block", whiteSpace: "nowrap"}}
      >
        Home
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("about")}
        href="about"
        itemCss={{fontSize: navbarItemFontSize}}
        className="mx-1"
        css={{display: "inline-block", whiteSpace: "nowrap"}}
      >
        Who We Are
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("services")}
        href="services"
        itemCss={{fontSize: navbarItemFontSize}}
        className="mx-1"
        css={{display: "inline-block", whiteSpace: "nowrap"}}
      >
        Services
      </NextUINavbar.Link>
      <NextUINavbar.Link
        href="/#contact"
        itemCss={{fontSize: navbarItemFontSize}}
        className="mx-1"
        css={{display: "inline-block", whiteSpace: "nowrap"}}
      >
        Contact
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("gallery")}
        href="gallery"
        itemCss={{fontSize: navbarItemFontSize}}
        className="mx-1"
        css={{display: "inline-block", whiteSpace: "nowrap"}}
      >
        Gallery
      </NextUINavbar.Link>
    </NextUINavbar.Content>
  )
}

export function Navbar() {

  const collapseItems = [
    {
      name: "Home",
      href: "home",
    },
    {
      name: "Who We Are",
      href: "about",
    },
    {
      name: "Services",
      href: "services",
    },
    {
      name: "Contact",
      href: "/#contact",
    },
    {
      name: "Gallery",
      href: "gallery",
    },
  ];

  return (
    <WLNav 
      height="80px"
      variant="sticky"
      maxWidth="xl"
    > 
      <WLNav.Left>  
        <WLNav.Toggle/>
        <WLNavBrandLeft source={logoBlack} title="Beyond The Bell" showIn="lg" />
        <WLNavSocials lineLeft>
          <WLNavSocials.Button platformKey={platformKeys.PHONE} color={iconFills.orange} href={callLink}/>
          <WLNavSocials.Button platformKey={platformKeys.MAIL} color={"#AB1CD6"} href={mailLink}/>
          <WLNavSocials.Button platformKey={platformKeys.FACEBLOCK} color={iconColors.facebook} href={facebookLink}/>
          <WLNavSocials.Button platformKey={platformKeys.LOCATION} color={iconFills.green} href={mapsLink}/>
        </WLNavSocials>
      </WLNav.Left>
      <WLNav.Center >
        <WLNavBrandCenter source={logoBlack} title="Beyond The Bell" hideIn="lg" />
      </WLNav.Center>
      <WLNav.Right >
        <NavbarPages />
        <NextUINavbar.Content css={{padding: 0}}>
          <NavbarContactButton />
        </NextUINavbar.Content>
      </WLNav.Right>
      
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
    </WLNav>
  )
}

function NavbarContactButton() {
  return (
    <NextUINavbar.Item css={{fontSize: navbarItemFontSize}}>
      <Button auto bordered color="gradient" onClick={() => window.location.href = "/#contact"}>
        Contact Us
      </Button>
    </NextUINavbar.Item>
  )
}