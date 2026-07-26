// Style Imports
import './App.css';
import "./libraries/Web-Legos/Layouts/wl.css";

// Library Imports
import { useEffect, useState } from 'react';

// Component Imports
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { createContext } from 'react';
import { WLFooterSocials } from './libraries/Web-Legos/components/Footer.jsx';
import logoTransparent from "./assets/images/logoTransparent.png"

// API Imports
import { firebaseConfig } from './api/firebase.ts'
import { AuthenticationManager, WLPermissionsConfig } from './libraries/Web-Legos/api/auth.ts'
import { WLThemeProvider, createWLTheme } from './libraries/Web-Legos/Layouts/WLThemes';
import Home from './routes/Home.jsx';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Navbar from './components/Navbar.jsx';
import { WLHeader, WLHeaderV2, WLTextV2 } from './libraries/Web-Legos/components/Text.jsx';
import { Link, Spacer, Text } from '@nextui-org/react';

import  {FooterAuthButton} from "./libraries/Web-Legos/components/Auth.jsx"

import {MailManager} from "./libraries/Web-Legos/api/mail.ts"

export const ANDCMailManager = new MailManager();
ANDCMailManager.addRecipientEmail("joedobbelaar@gmail.com");
ANDCMailManager.addRecipientEmail("rachel.newday@gmail.com");

/** Context to keep track of current user */
export const CurrentSignInContext = createContext();

/** Context to keep track whether we're running tests right now */
export const TestingContext = createContext();

/** Site specific permissions */
const permissions = new WLPermissionsConfig();

/** Site AuthenticationManager */
const authenticationManager = new AuthenticationManager(firebaseConfig, permissions);
authenticationManager.initialize();

const theme = createWLTheme();

export function App(props) {

  const [currentSignIn, setCurrentSignIn] = useState(null);

  /** Whether this is a testing environment */
  const isTestingEnvironment = props.isTestingEnvironment;

  /** Provider for all app contexts */
  function AppContextProvider(props) {
    return (
      <AuthenticationManager.Context.Provider value={{authenticationManager}} >
      <TestingContext.Provider value={{isTestingEnvironment}} >
      <CurrentSignInContext.Provider value={{currentSignIn}} >
        {props.children}
      </CurrentSignInContext.Provider>
      </TestingContext.Provider>
      </AuthenticationManager.Context.Provider >
    )
  }

  // If we're testing, just place everything in context provider
  if (props.children) {
    return (
      <AppContextProvider >
        { isTestingEnvironment && <meta data-testid="wl-testing-flag" /> }
        {props.children}
      </AppContextProvider>
    )
  }

  const linkedinLink = "https://www.linkedin.com/in/rachel-dayanim-09aa2443/";
  const facebookLink = "https://www.facebook.com/anewdaycoaching";
  const instagramLink = "https://www.instagram.com/anewdaycoaching/";

  // Return the app
  return (
    <div className="App d-flex flex-column align-items-center w-100" data-testid="app">
      <MantineProvider>
      <WLThemeProvider theme={theme}>
      <AppContextProvider>
        { isTestingEnvironment && <meta data-testid="wl-testing-flag" /> }
        <Router>
          <div className="app-content">
            <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
              <footer className="pt-5 flex-column align-items-center justify-content-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  {/* <WLHeaderV2 size="$4xl" align="center">A New Day Coaching</WLHeaderV2>           */}
                  <img src={logoTransparent} alt="A New Day Coaching" style={{width: "400px"}} />
                <WLFooterSocials lineBottom>
                  <WLFooterSocials.Button color="#647659" size="42" platformKey="linkedin" href={linkedinLink} />
                  <WLFooterSocials.Button color="#647659" size="42" platformKey="facebook" href={facebookLink} />
                  <WLFooterSocials.Button color="#647659" size="42" platformKey="instagram" href={instagramLink} />
                </WLFooterSocials>
                <Spacer y={1} />
                  <WLTextV2 firestoreId="contact-name" />
                  <Link href="mailto:rachel.newday@gmail.com">
                    <Text css={{textDecoration:"underline"}}>rachel.newday@gmail.com</Text>
                  </Link>
                  <Link href="callto:2027982343">
                    <Text css={{textDecoration:"underline"}}>(202) 798-ADHD</Text>
                  </Link>
                </div>
                <div className="d-lg-flex w-100 d-none flex-row gap-2 align-items-end justify-content-around">
                  <Link href="https://www.joed.dev">
                    <Text css={{textDecoration:"underline"}}>Web Designer: Joe Dobbelaar</Text>
                  </Link>
                  <FooterAuthButton link authManager={authenticationManager} currentSignIn={currentSignIn} setCurrentSignIn={setCurrentSignIn}/>
                </div>
                <div className="d-flex d-lg-none flex-row gap-2 align-items-center justify-content-center">
                  <Link href="https://www.joed.dev">
                    <Text css={{textDecoration:"underline"}}>Web Designer: Joe Dobbelaar</Text>
                  </Link>
                </div>
                <div className="d-flex d-lg-none flex-row gap-2 align-items-center justify-content-center">
                  <FooterAuthButton link authManager={authenticationManager} currentSignIn={currentSignIn} setCurrentSignIn={setCurrentSignIn}/>
                </div>
              </footer>
          </div>
        </Router>
      </AppContextProvider>
      </WLThemeProvider>
      </MantineProvider>
    </div>
  );
}

export default App;
