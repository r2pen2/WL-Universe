import './App.css';
import '@mantine/core/styles.css';

import "./assets/style/colorTheme.css";
import "./assets/style/tables.css"

import { AppShell, useMantineColorScheme } from '@mantine/core';
import { createContext, memo, useEffect, useMemo, useState } from 'react';
import { AppShellNavigator, navigationItems } from './components/Navigation';
import { AppShellHeader } from './components/Header';
import Invoices from './tabs/Invoices';
import Forms from './tabs/Forms';
import Settings from './tabs/Settings';
import { getCurrentUser } from './api/firebase';
import Login from './tabs/Login';
import Schedule from './tabs/Schedule';
import Dashboard from './tabs/Dashboard';
import { getTab } from './api/browser.ts';
import ToolManagement from './tabs/ToolManagement.jsx';
import FormManagement from './tabs/FormManagement.jsx';
import InvoiceManagement from './tabs/InvoiceManagement.jsx';
import UserManagement from './tabs/UserManagement.jsx';
import RoleModal from './components/RoleModal.jsx';
import ThanksModal from './components/ThanksModal.jsx';


export const CurrentUserContext = createContext();
export const SettingsContext = createContext();

function App() {
  
  const [currentUser, setCurrentUser] = useState({id: null});   // State for the current user
  const currentUserId = useMemo(() => currentUser.id, [currentUser.id]) // We only want to re-render the entire App state when the current userId changes
  
  const {setColorScheme, clearColorScheme} = useMantineColorScheme(); // State for the color scheme

  /** Get the current user on load */
  useEffect(() => { getCurrentUser(setCurrentUser, setColorScheme); }, []);
  
  return (
    <CurrentUserContext.Provider value={{currentUser, setCurrentUser}}>
      {/* This context needs to go on the outside of the AppContent! */}
      <AppContent currentUserId={currentUserId} />
    </CurrentUserContext.Provider>
  )
}
    
export default App;

const AppContent = memo(function AppContent({currentUserId}) {
  
  const [burgerOpen, setBurgerOpen] = useState(false);    // State for the burger menu
  const [currentTab, setCurrentTab] = useState(getTab()); // Get the current tab from the URL
  
  const CurrentTab = () => {
    switch (currentTab) {
      case navigationItems.DASHBOARD:
        return <Dashboard setTab={setCurrentTab}/>
      case navigationItems.INVOICES:
        return <Invoices />
      case navigationItems.FORMS:
        return <Forms />
      case navigationItems.SCHEDULE:
        return <Schedule />
      case navigationItems.SETTINGS:
        return <Settings />
      case navigationItems.ADMINTOOLS:
        return <ToolManagement />
      case navigationItems.ADMINFORMS:
        return <FormManagement />
      case navigationItems.ADMININVOICES:
        return <InvoiceManagement />
      case navigationItems.ADMINUSERS:
        return <UserManagement />
      default:
    }
  }

  if (!currentUserId) {
    return <Login />
  }

  return (
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'lg', collapsed: { mobile: !burgerOpen } }}
      >
        <AppShellHeader burgerOpen={burgerOpen} setBurgerOpen={setBurgerOpen}/> 
        <AppShellNavigator currentTab={currentTab} setCurrentTab={(t) => {window.location.hash = t; setCurrentTab(t)}} setBurgerOpen={setBurgerOpen}/>
        <AppShell.Main className="bg-gray-1">
            <ThanksModal />
            <RoleModal />
            <CurrentTab />
        </AppShell.Main>
      </AppShell>
  )
})
