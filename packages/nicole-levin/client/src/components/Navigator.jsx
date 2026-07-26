import { Divider, Link, Text } from '@nextui-org/react'
import React from 'react'
import {Navbar as NextUINavbar} from '@nextui-org/react'
import { useState } from 'react'
import { useRef } from 'react'

export const navigatorWidth = "330px"

export default function Navigator() {
  
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const navbarToggleRef = useRef();
  
  function handleSideMenu() {
    isSideMenuOpen && navbarToggleRef.current.click();
  }

  return [
    <nav className='d-none d-lg-flex custom'>
      <Link href="#about">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          About
        </Text>
      </Link>
      <Link href="#psychotherapy">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Psychotherapy
        </Text>
      </Link>
      <Link href="#yoga-and-workshops">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Yoga, Pilates, & Dance
        </Text>
      </Link>
      <Link href="#yoga-and-workshops">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Gestalt Workshops
        </Text>
      </Link>
      <Link href="#personal-statement">
        <Text size="$lg" color="#291250" style={{margin: 0}}>
          Personal Statement
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
            href="#yoga-and-pilates"
          >
            Yoga, Pilates, & Dance
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
            href="#workshops"
          >
            Gestalt Workshops
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
            href="#personal-statement"
          >
            Personal Statement
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
