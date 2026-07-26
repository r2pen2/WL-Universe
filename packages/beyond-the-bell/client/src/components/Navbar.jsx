// Library Imports
import React from 'react';
import { Navbar as NextUINavbar, Dropdown, Text, Image, Link } from "@nextui-org/react";

import { SchoolDaysIcon, ScholarshipIcon, iconFills } from './Icons';

import { callLink, facebookLink, mapsLink, mailLink, scholarshipLink, applicationLink, } from '../api/links';

import { iconColors } from "../libraries/Web-Legos/components/Icons";

import logoBlack from "../assets/images/logoTransparentBlack.png";

// Style Imports
import "../assets/style/navbar.css";
import "../assets/style/layout.css";
import { btbOrange } from '../assets/style/colors';
import { WLNav, WLNavBrandCenter, WLNavBrandLeft, WLNavDropdownMenu, WLNavSocials } from '../libraries/Web-Legos/components/Navigation';
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
        isActive={checkLinkActive("contact")}
        href="contact"
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
      href: "contact",
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
          <NavbarScheduleDropdown />
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

function NavbarScheduleDropdown() {
  return (
    <WLNavDropdownMenu
      hideTextIn="lg"
      buttonIcon={<svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32"><path fill={btbOrange} d="M700-80v-120H580v-60h120v-120h60v120h120v60H760v120h-60Zm-520-80q-24 0-42-18t-18-42v-540q0-24 18-42t42-18h65v-60h65v60h260v-60h65v60h65q24 0 42 18t18 42v302q-15-2-30-2t-30 2v-112H180v350h320q0 15 3 30t8 30H180Zm0-470h520v-130H180v130Zm0 0v-130 130Z"/></svg>} 
      buttonBordered 
      buttonText="Schedule" 
      buttonFontSize={navbarItemFontSize}
      links={[
        {
          key: "application",
          href: applicationLink
        },
        {
          key: "scholarship",
          href: scholarshipLink
        },
      ]}
    >
      <Dropdown.Item
        key="application"
        description="Click to open application"
        icon={<SchoolDaysIcon fill={iconFills.orange} />}
      >
        BTB Student Application
      </Dropdown.Item>
      <Dropdown.Item
        withDivider
        key="scholarship"
        description="Click to open application"
        icon={<ScholarshipIcon fill={iconFills.green} />}
      >
        The Little Fiddle Scholarship
      </Dropdown.Item>
    </WLNavDropdownMenu>
  )
}