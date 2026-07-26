import { Divider, Link, Text } from '@nextui-org/react'
import React from 'react'
import {Navbar as NextUINavbar} from '@nextui-org/react'
import { useState } from 'react'
import { useRef } from 'react'
import "../assets/style/navbarV2.css"

export const navigatorWidth = "330px"

export default function Navbar() {
  
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const navbarToggleRef = useRef();
  
  function handleSideMenu() {
    isSideMenuOpen && navbarToggleRef.current.click();
  }

  return [
    <nav className='d-none d-lg-flex custom'>
      <Link href="#home">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Home
        </Text>
      </Link>
      <Link href="#about">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          About
        </Text>
      </Link>
      <Link href="#services">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Services
        </Text>
      </Link>
      <Link href="#contact">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Contact
        </Text>
      </Link>
    </nav>,
    <NextUINavbar
      height="60px"
      style={{
        padding: 0,
      }}
      variant="sticky"
      maxWidth="xl"
      className='d-flex d-lg-none'
    >
      <NextUINavbar.Toggle onChange={(s) => setIsSideMenuOpen(s)} ref={navbarToggleRef}/>
      <NextUINavbar.Collapse>
        <NextUINavbar.CollapseItem
        >
          <Link
          onClick={handleSideMenu}
            color="inherit"
            css={{
              minWidth: "100%",
              paddingLeft: "1rem"
            }}
            href="#home"
            >
            Home
          </Link>
        </NextUINavbar.CollapseItem>
        <NextUINavbar.CollapseItem
        >
          <Link
          onClick={handleSideMenu}
            color="inherit"
            css={{
              minWidth: "100%",
              paddingLeft: "1rem"
            }}
            href="#about"
          >
            About
          </Link>
        </NextUINavbar.CollapseItem>
        <NextUINavbar.CollapseItem
        >
          <Link
          onClick={handleSideMenu}
            color="inherit"
            css={{
              minWidth: "100%",
              paddingLeft: "1rem"
            }}
            href="#services"
          >
            Services
          </Link>
        </NextUINavbar.CollapseItem>
        <NextUINavbar.CollapseItem
        >
          <Link
          onClick={handleSideMenu}
            color="inherit"
            css={{
              minWidth: "100%",
              paddingLeft: "1rem"
            }}
            href="#contact"
          >
            Contact
          </Link>
        </NextUINavbar.CollapseItem>
      </NextUINavbar.Collapse>
    </NextUINavbar>
  ]
}
