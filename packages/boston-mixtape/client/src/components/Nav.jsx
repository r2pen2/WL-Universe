import { useState } from "react";

import {Link, Navbar as NextUINavbar} from '@nextui-org/react'
import { useRef } from 'react'


export const Nav = () => {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  
  const navbarToggleRef = useRef();
  
  function handleSideMenu() {
    isSideMenuOpen && navbarToggleRef.current.click();
  }

  return ([
  <div style={{position: "absolute", top: 0}} key="nav-large" className="w-100 flex-row d-none d-lg-flex gap-5 z-high align-items-center justify-content-center">
    <a href="#home" className="nav-link gibbons-regular">Home</a>
    <a href="#ensemble" className="nav-link gibbons-regular">Ensemble</a>
    <a href="#repertoire" className="nav-link gibbons-regular">Repertoire</a>
    <a href="#services" className="nav-link gibbons-regular">Services</a>
    <a href="#differentiation" className="nav-link gibbons-regular">Differentiaton</a>
    <a href="#contact" className="nav-link gibbons-regular">Contact</a>
  </div>,
    <NextUINavbar
    height="60px"
    style={{
      padding: 0,
    }}
    key="nav-small"
    variant="sticky"
    maxWidth="xl"
    className='d-flex d-lg-none z-high gibbons-regular'
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
          href="#ensemble"
        >
          Ensemble
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
          href="#repertoire"
        >
          Repertoire
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
          href="#differentiation"
        >
          Differentiation
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
)}