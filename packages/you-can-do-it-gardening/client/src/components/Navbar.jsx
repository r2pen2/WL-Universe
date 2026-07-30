// Library Imports
import React from 'react';
import { Navbar as NextUINavbar, Link, Dropdown, Divider, Text, } from "@nextui-org/react";

import logoBlack from "../assets/images/logoNoText.png";

import ContentCutTwoToneIcon from '@mui/icons-material/ContentCutTwoTone';
import FilterVintageTwoToneIcon from '@mui/icons-material/FilterVintageTwoTone';
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';

import LocalMallTwoToneIcon from '@mui/icons-material/LocalMallTwoTone'
import OndemandVideoTwoToneIcon from '@mui/icons-material/OndemandVideoTwoTone';
import StoreMallDirectoryTwoToneIcon from '@mui/icons-material/StoreMallDirectoryTwoTone';
import HandymanTwoToneIcon from '@mui/icons-material/HandymanTwoTone';

// Style Imports
import "../assets/style/navbar.css";
import "../assets/style/layout.css";

import { WLNavBrandLeft, WLNavContent, WLNavDropdownMenu } from "../libraries/Web-Legos/components/Navigation";

const navbarItemFontSize = "18px";


const collapseItems = [
  {
    name: "Home",
    href: "home",
  },
  {
    name: "About",
    href: "about",
  },
  {
    name: "Services & Fees",
    href: "services",
  },
  {
    name: "Resources",
    href: "resources",
  },
  {
    name: "Gallery",
    href: "gallery",
  },
  {
    name: "Find Me",
    href: "find-me",
  },
  {
    faq: "FAQ",
    href: "faq"
  }
];

function NavbarPages() {

  function checkLinkActive(route) {
    const location = window.location.pathname;
    if (route === "home" && window.location.pathname.length < 2) {
      return true;
    }
    return location.includes(route);
  }

  return (
    <NextUINavbar.Content enableCursorHighlight activeColor="primary" className='d-none d-xxl-flex flex-row align-items-center justify-content-end w-100 px-0'>
      <NextUINavbar.Link 
        isActive={checkLinkActive("home")}
        href="home"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        Home
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("about")}
        href="about"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        About
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("services")}
        href="services"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        Services & Fees
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("resources")}
        href="resources"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        Resources
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("gallery")}
        href="gallery"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        Gallery
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("find-me")}
        href="find-me"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        Find Me
      </NextUINavbar.Link>
      <NextUINavbar.Link 
        isActive={checkLinkActive("faq")}
        href="faq"
        itemCss={{fontSize: navbarItemFontSize}}
      >
        FAQ
      </NextUINavbar.Link>
    </NextUINavbar.Content>
  )
}


export function Navbar() {

  return (
    <NextUINavbar 
      height="80px"
      variant="sticky"
      maxWidth="xl"
    >
      <WLNavContent>
        <WLNavContent.Left>
          <NextUINavbar.Toggle className="d-flex d-xxl-none px-3" />
          <WLNavBrandLeft showIn="md" source={logoBlack} title="You Can Do It Gardening" />
          <Divider className="d-none d-xxl-inline" css={{width: "3rem", marginLeft: "1rem"}}/>
          <NavbarPages />
        </WLNavContent.Left>
        <WLNavContent.Right>
          <ShopDropdown />
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

function ShopDropdown() {
  return (
    <NextUINavbar.Content css={{padding: 0}}>
      <WLNavDropdownMenu 
        hideTextIn="all"
        buttonIcon={<Text className="m-0">SHOP</Text>}
        buttonLight 
        buttonText="SHOP" 
        buttonFontSize={navbarItemFontSize} 
        links={[
          // {
          //   key: "swag",
          //   href: "https://youcandoitgardening.creator-spring.com/",
          // },
          // {
          //   key: "hydrangea",
          //   href: "https://youcangardening.samcart.com/products/hydrangea-pruning-guide",
          // },
          // {
          //   key: "pruning",
          //   href: "https://youcangardening.samcart.com/products/comprehensive-pruning-guide",
          // },
          // {
          //   key: "new-homeowner",
          //   href: "https://youcangardening.samcart.com/products/new-homeowners-guide",
          // },
          // {
          //   key: "new-homeowner-masterclass",
          //   href: "https://youcangardening.samcart.com/products/new-homeowners-masterclass",
          // },
          {
            key: "stan-store",
            href: "https://stan.store/youcandoitgardening",
          },
          // {
          //   key: "resources",
          //   href: "https://www.youcandoitgardening.com/resources",
          // }
        ]}
      >
        {/* <Dropdown.Item
          key="swag"
          showFullDescription 
          withDivider
          description="Show the world your support with You Can Do It Gardening merch!"
          icon={<LocalMallTwoToneIcon style={{color: "#730050"}} />}
        >
          Swag
        </Dropdown.Item>
        <Dropdown.Item
          key="hydrangea"
          showFullDescription 
          withDivider
          description="Demystify the plant that has everyone scratching their heads in confusion!"
          icon={<FilterVintageTwoToneIcon style={{color: "#6B88D2"}} />}
        >
          Hydrangea Pruning Guide
        </Dropdown.Item>
        <Dropdown.Item
          key="pruning"
          showFullDescription 
          withDivider
          description="Simple, straightforward information about pruning major categories of plants, including hydrangeas."
          icon={<ContentCutTwoToneIcon style={{color: "#4C9855"}} />}
        >
          Pruning Guide
        </Dropdown.Item>
        <Dropdown.Item
          key="new-homeowner"
          showFullDescription 
          withDivider
          description="Learn how to avoid making costly mistakes and have the landscape of your dreams."
          icon={<HomeTwoToneIcon style={{color: "tomato"}} />}
        >
          New Homeowner's Guide
        </Dropdown.Item>
        <Dropdown.Item
          key="new-homeowner-masterclass"
          showFullDescription 
          withDivider
          description="This masterclass will help you get a handle on your situation so you can maintain your property economically and create the garden of your dreams."
          icon={<OndemandVideoTwoToneIcon style={{color: "goldenrod"}} />}
        >
          New Homeowners Masterclass
        </Dropdown.Item> */}
        <Dropdown.Item
          key="stan-store"
          showFullDescription 
          withDivider
          description="Check out digital and other products here!"
          icon={<StoreMallDirectoryTwoToneIcon style={{color: "crimson"}} />}
        >
          Store
        </Dropdown.Item>
        {/* <Dropdown.Item
          key="resources"
          showFullDescription 
          withDivider
          description="See a list of all posted resources."
          icon={<HandymanTwoToneIcon style={{color: "darkgreen"}} />}
        >
          Resources
        </Dropdown.Item> */}
      </WLNavDropdownMenu>
    </NextUINavbar.Content>
  )
}