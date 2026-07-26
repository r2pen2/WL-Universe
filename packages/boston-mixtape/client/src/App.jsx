// Style Imports
import './App.css';
import "./libraries/Web-Legos/Layouts/wl.css";

// Component Imports
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Link, Spacer, Text } from '@nextui-org/react';
import { createContext, useState } from 'react';

import logo from "./assets/images/homepage/casette.png"

// API Imports
import { firebaseConfig } from './api/firebase.ts'
import { AuthenticationManager, WLPermissionsConfig } from './libraries/Web-Legos/api/auth.ts'
import { AnalyticsManager } from './libraries/Web-Legos/api/analytics.ts'
import { WLThemeProvider, createWLTheme } from './libraries/Web-Legos/Layouts/WLThemes';
import Home from './routes/Home.jsx';
import '@mantine/core/styles.css';
import {MailManager} from "./libraries/Web-Legos/api/mail.ts"
import { WLTextV2 } from './libraries/Web-Legos/components/Text.jsx';


import { WLFooterSocials } from './libraries/Web-Legos/components/Footer.jsx';
import  {FooterAuthButton} from "./libraries/Web-Legos/components/Auth.jsx"
import { setHostname } from './libraries/Web-Legos/api/development.ts';
import { Nav } from './components/Nav.jsx';

/** Context to keep track of current user */
export const CurrentSignInContext = createContext();

/** Context to keep track whether we're running tests right now */
export const TestingContext = createContext();

/** Site specific permissions */
const permissions = new WLPermissionsConfig();

/** Site AuthenticationManager */
const authenticationManager = new AuthenticationManager(firebaseConfig, permissions);
authenticationManager.initialize();

/** Site AnalyticsManager */
const analyticsManager = new AnalyticsManager(firebaseConfig)
analyticsManager.initialize();

const theme = createWLTheme();

export const BBOMailManager = new MailManager();
BBOMailManager.addRecipientEmail("joedobbelaar@gmail.com");
BBOMailManager.addRecipientEmail("BostonMixtapeInfo@gmail.com");
BBOMailManager.addRecipientEmail("BBMbostonsbestmusic@gmail.com");

setHostname("bbm.joed.dev")

export function App(props) {

  const [currentSignIn, setCurrentSignIn] = useState(null);

  /** Whether this is a testing environment */
  const isTestingEnvironment = props.isTestingEnvironment;

  /** Provider for all app contexts */
  function AppContextProvider(props) {
    return (
      <AuthenticationManager.Context.Provider value={{authenticationManager}} >
      <AnalyticsManager.Context.Provider value={{analyticsManager}} >
      <TestingContext.Provider value={{isTestingEnvironment}} >
      <CurrentSignInContext.Provider value={{currentSignIn}} >
        {props.children}
      </CurrentSignInContext.Provider>
      </TestingContext.Provider>
      </AnalyticsManager.Context.Provider>
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

  // Return the app
  return (
    <div className="App d-flex flex-column align-items-center w-100" data-testid="app">
      <WLThemeProvider theme={theme}>
      <AppContextProvider>
        { isTestingEnvironment && <meta data-testid="wl-testing-flag" /> }
        <Router>
          <div className="app-content">
              <Nav />
              <Routes>
                <Route path="/" element={<Home />} />
              </Routes>
          </div>
          
          <footer className="pt-2 flex-column align-items-center justify-content-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <WLTextV2 className="gibbons-regular" firestoreId="contact-name" />
                  <img src={logo} alt="Boston Mixtape Logo" style={{width: 300}}  />
                  <Link href="mailto:bbmbostonsbestmusic@gmail.com">
                    <Text css={{textDecoration:"underline"}}>Click Here to Email Us</Text>
                  </Link>
                  <Link href="callto:6178773206">
                    <Text css={{textDecoration:"underline"}}>Click Here to Call</Text>
                  </Link>
                <WLFooterSocials>
                  <WLFooterSocials.Button color="#b3324a" size="42" platformKey="facebook" href="https://www.facebook.com/berachorchestra/" />
                </WLFooterSocials>
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
        </Router>
      </AppContextProvider>
      </WLThemeProvider>
    </div>
  );
}

export default App;
