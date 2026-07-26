// Library Imports
import {AppShell, Badge, NavLink } from "@mantine/core"
import { IconHome2, IconCreditCard, IconCalendarEvent, IconSettings, IconFiles, IconTools, IconBrandGoogleDrive, IconUserCog, IconBrandGithub } from '@tabler/icons-react';
import { useContext, useState } from "react";
// Component Imports
import { CurrentUserContext } from "../App";

import "../assets/style/navigation.css"
import { LinkMaster } from "../api/links.ts";

const todoLink = "https://github.com/r2pen2/ANewDayCoachingCRM/issues";

/**
 * Object containing names for navigation tabs.
 * @typedef {Object} NavigationStyles
 * @property {string} DASHBOARD - The dashboard's tab ID.
 * @property {string} INVOICES - The invoice page's tab ID.
 * @property {string} SCHEDULE - The schedule page's tab ID.
 * @property {string} SETTINGS - The settings page's tab ID.
 * @property {string} TOOLS - The tools page's tab ID.
 */
export const navigationItems = {
  DASHBOARD: "dashboard",
  INVOICES: "invoices",
  SCHEDULE: "schedule",
  FORMS: "forms",
  SETTINGS: "settings",
  ADMINTOOLS: "tools-admin",
  ADMINFORMS: "forms-admin",
  ADMININVOICES: "invoices-admin",
  ADMINUSERS: "users-admin",
  TODO: "todo",
}

/**
 * Renders the navigation bar for the app shell.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.currentTab - The currently active tab.
 * @param {function} props.setCurrentTab - A function to set the current tab.
 * @returns {JSX.Element} The rendered component.
 */
export function AppShellNavigator({currentTab, setCurrentTab, setBurgerOpen}) {
  
  const {currentUser} = useContext(CurrentUserContext)
  
  /** Change current tab state & close the burger when a new tab is pressed */
  function updateTab(tab) { setCurrentTab(tab); setBurgerOpen(false); }
  
  /** Renders the invoices badge when there are unpaid invoices */
  const InvoicesBadge = () => {
    /** The number to display in invoices badge */
    const invoiceBadgeNumber = currentUser.numUnpaidInvoices;
    /** The text to display as tooltop over forms badge */
    if (invoiceBadgeNumber <= 0) { return; }
    return (
      <Badge size="xs" color="red" circle>{invoiceBadgeNumber}</Badge>
    )
  }

  /** Renders the forms badge when there are incomplete forms */
  const FormsBadge = () => {
    /** The number to display in forms badge */
    const formsBadgeNumber = currentUser.formAssignments.filter(fa => fa.completed === false).length;
    /** The text to display as tooltop over invoices badge */
    if (formsBadgeNumber <= 0) { return; }
    return (
      <Badge size="xs" color="red" circle>{formsBadgeNumber}</Badge>
    )
  }

  const iconProps = {
    className: "nav-icon",
    size: "2rem"
  }

  const WiggleClickNavLink = ({label, description, leftSection, active, tabKey}) => {
    const [wiggling, setWiggling] = useState(false);
    
    function handleClick() {
      setWiggling(true);
      if (tabKey === navigationItems.TODO) { window.open(LinkMaster.ensureAbsoluteUrl(todoLink), "_blank"); return; }
      updateTab(tabKey);
      setTimeout(() => setWiggling(false), 500);
    } 

    return (
      <NavLink
        color="#2c6116"
        className={`nav-link-hover-catcher ${wiggling ? "wiggle" : ""}`}
        label={label}
        description={description}
        leftSection={leftSection}
        active={currentTab === tabKey}
        onClick={handleClick}
      />
    )
  }

  const AdminTabs = () => {
    if (!currentUser.admin) { return; }
    return [
      <WiggleClickNavLink
        key="admin-tools-nav"
        label="Manage Tools"
        description="Create new tools or modify existing ones, then assign them to users."
        leftSection={<IconTools {...iconProps} />}
        tabKey={navigationItems.ADMINTOOLS}
      />,
      <WiggleClickNavLink
        key="admin-forms-nav"
        label="Manage Forms"
        description="Assign forms to users and view completion statistics."
        leftSection={<IconFiles {...iconProps} />}
        tabKey={navigationItems.ADMINFORMS}
      />,
      <WiggleClickNavLink
        key="admin-invoices-nav"
        label="Manage Invoices"
        description="Send invoices to users, as well as confirm that you've received payments."
        leftSection={<IconCreditCard {...iconProps} />}
        tabKey={navigationItems.ADMININVOICES}
      />,
      <WiggleClickNavLink
        key="admin-users-nav"
        label="Manage Users"
        description="Manage all users, including their roles and personal information."
        leftSection={<IconUserCog {...iconProps} />}
        tabKey={navigationItems.ADMINUSERS}
      />,
      <WiggleClickNavLink
        key="todo-nav"
        label="GitHub Todos"
        description="Visit my Github page and check the status of todo items."
        leftSection={<IconBrandGithub {...iconProps} />}
        tabKey={navigationItems.TODO}
      />,
    ]
  }

  return (    
    <AppShell.Navbar p="md" zIndex={100} style={{overflowY: "scroll"}}>
      <WiggleClickNavLink
        label="Dashboard"
        description="My Assignments, My Intent, My Tools, My Shared Drive, Etc."
        leftSection={<IconHome2 {...iconProps} />}
        tabKey={navigationItems.DASHBOARD}
      />
      <WiggleClickNavLink
        label="Invoices"
        description="View and pay invoices via PayPal, Venmo, or Zelle."
        leftSection={<IconCreditCard {...iconProps} />}
        rightSection={<InvoicesBadge />}
        tabKey={navigationItems.INVOICES} 
      />
      <WiggleClickNavLink
        label="Meeting Schedule"
        description="View your upcoming appointments and schedule new ones."
        leftSection={<IconCalendarEvent {...iconProps} />}
        tabKey={navigationItems.SCHEDULE}
      />
      <WiggleClickNavLink
        label="Forms"
        description="Complete your assigned forms here."
        leftSection={<IconFiles {...iconProps} />}
        rightSection={<FormsBadge />}
        tabKey={navigationItems.FORMS}
      />
      <WiggleClickNavLink
        label="Settings"
        description="Modify your personal information and the appearance of this portal."
        leftSection={<IconSettings {...iconProps} />}
        tabKey={navigationItems.SETTINGS}
      />
      <AdminTabs />
    </AppShell.Navbar>
  )
}