// Style Imports
import './App.css';
import "./libraries/Web-Legos/Layouts/wl.css";

// Component Imports
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { createContext, useEffect, useState } from 'react';
import { createTheme as createMantineTheme, MantineProvider } from "@mantine/core"
import {WLThemeProvider, createWLTheme} from "./libraries/Web-Legos/Layouts/WLThemes"
import {FooterAuthButton} from "./libraries/Web-Legos/components/Auth"

// API Imports
import { firebaseConfig } from './api/firebase.ts'
import { AuthenticationManager, WLPermissionsConfig } from './libraries/Web-Legos/api/auth.ts'
import { AnalyticsManager } from './libraries/Web-Legos/api/analytics.ts'
import Navbar from './components/NavbarV2';
import Homepage from './routes/Homepage';
import HomepageV2 from './routes/HomepageV2';
import {MailManager} from "./libraries/Web-Legos/api/mail.ts"
import { WLHeaderV2 } from './libraries/Web-Legos/components/Text.jsx';
import { Link, Spacer, Text } from '@nextui-org/react';

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

const backgroundColor1 = "rgb(44, 44, 45)";
const backgroundColor2 = "rgb(26, 26, 30)";
export const platformGradient = `linear-gradient(239.59deg, ${backgroundColor1} -44.65%, ${backgroundColor2} 75.57%)`;

const wlTheme = createWLTheme();
const mantineTheme = createMantineTheme({});

export const TAGMailManager = new MailManager();
TAGMailManager.addRecipientEmail("joedobbelaar@gmail.com");

export function App(props) {

  /** Whether this is a testing environment */
  const isTestingEnvironment = props.isTestingEnvironment;

  const [currentSignIn, setCurrentSignIn] = useState(null)

  

  const [userCanEditText, setUserCanEditText] = useState(false);
  const [userCanEditImages, setUserCanEditImages] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    authenticationManager.getPermission(currentSignIn, "siteImages").then(p => setUserCanEditImages(p));
  }, [currentSignIn]);

  /** Provider for all app contexts */
  function AppContextProvider(props) {
    return (
      <AuthenticationManager.Context.Provider value={{AuthenticationManager}} >
      <AnalyticsManager.Provider.Context.Provider value={{analyticsManager}} >
      <TestingContext.Provider value={{isTestingEnvironment}} >
        {props.children}
      </TestingContext.Provider>
      </AnalyticsManager.Provider.Context.Provider>
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
    <MantineProvider theme={mantineTheme}>
    <WLThemeProvider theme={wlTheme}>
      <div className="App d-flex flex-column align-items-center w-100" data-testid="app">
        { isTestingEnvironment && <meta data-testid="wl-testing-flag" /> }
        <Router>
          <div className="app-content" >
            <Navbar />
              <Routes>
                <Route path="*" element={<HomepageV2 userCanEditText={userCanEditText} />} />
              </Routes>
              <footer className="p-5 flex-column align-items-center justify-content-center">
                <div id="contact" className="d-flex flex-column align-items-center justfy-content-center">
                  <div className="flex-column d-flex gap-2 align-items-center justify-content-start">
                    <Link href="mailto:talkaboutdreams@yahoo.com">
                      <Text size="$lg" css={{textDecoration:"underline"}}>talkaboutdreams@yahoo.com</Text>
                    </Link>
                    <Text>・</Text>
                    <Link href="callto:6172991792">
                      <Text size="$lg" css={{textDecoration:"underline"}}>(617) 299-1792</Text>
                    </Link>
                  </div>
                </div>
                <Spacer y={1}/>
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <Link href="https://www.joed.dev">
                    <Text color="#8C8C8C" css={{textDecoration:"underline"}}>Web Designer: Joe Dobbelaar</Text>
                  </Link>
                  <FooterAuthButton authManager={authenticationManager} currentSignIn={currentSignIn} setCurrentSignIn={setCurrentSignIn}/>
                </div>
              </footer>
          </div>
        </Router>
      </div>
    </WLThemeProvider>
    </MantineProvider>
  );
}

export default App;
