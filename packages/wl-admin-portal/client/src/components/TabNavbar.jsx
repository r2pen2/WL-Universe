import React from 'react'
import { CurrentSiteContext, CurrentTabContext } from '../App'
import { Navbar as NextUINavbar, Text } from "@nextui-org/react"
import { WLNavContent } from '../libraries/Web-Legos/components/Navigation'
import { SiteModule, siteModules } from '../libraries/Web-Legos/api/admin.ts'
import { AppBar, BottomNavigation, BottomNavigationAction } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';

export default function TabNavbar() {

  const {currentTab, setCurrentTab} = React.useContext(CurrentTabContext)
  const { currentSite } = React.useContext(CurrentSiteContext)
  

  function getTabData(t) {
    switch (t) {
      case SiteModule.analytics:
        return {
          label: "Analytics",
          icon: <InsightsIcon sx={{color: "#D41D6D"}} />
        };
      case SiteModule.users:
        return {
          label: "Users",
          icon: <PeopleIcon sx={{color: "#00AE17"}} />
        };
      case SiteModule.forms:
        return {
          label: "Forms",
          icon: <AssignmentIcon sx={{color: "#1777F2"}} />
        };
      case SiteModule.log:
        return {
          label: "Log",
          icon: <EditIcon sx={{color: "#AB2FD6"}} />
        };
      default:
        return;
    }
  }

    /**
   * Sets active bottomnav element to the one that was just clicked 
   * @param {Event} event the event that triggered this function call
   * @param {String} newValue the value of the new active element
   */
    const handleChange = (event, newValue) => {
      event.preventDefault();
      setCurrentTab(newValue);
    };

  return (
    <AppBar position="fixed" sx={{top: "auto", bottom: 0}}>
      <BottomNavigation sx={{width: "100%"}} value={currentTab} onChange={handleChange}>
        {
          siteModules[currentSite.siteKey].sort().map((m, i) => {
            const tab = getTabData(m);
            return (
              <BottomNavigationAction
                key={i}
                label={tab.label}
                value={m}
                icon={tab.icon}
              />
            )
          })
        }
      </BottomNavigation>
    </AppBar>
  )
}
