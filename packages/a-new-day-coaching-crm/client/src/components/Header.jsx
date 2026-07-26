// Library Imports
import { AppShell, Burger, Group } from "@mantine/core";
// Component Imports
import logo from "../assets/images/sun.png";

export function AppShellHeader({burgerOpen, setBurgerOpen}) {
  return (
    <AppShell.Header>
      <Group h="100%" px="md">
        <Burger opened={burgerOpen} onClick={() => setBurgerOpen(!burgerOpen)} hiddenFrom="lg" size="sm" />
        <img src={logo} alt="Logo" style={{ height: 40 }} />
        <h1 style={{fontSize: "1.5rem", marginBottom: 0}} className="raleway-regular">Bluprint</h1>
      </Group>
    </AppShell.Header>
  )
}