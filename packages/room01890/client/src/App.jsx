// Style Imports
import "./libraries/Web-Legos/Layouts/wl.css";

// Library Imports
import { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

// API Imports
import { firebaseConfig } from "./api/firebase.ts";
import { AuthenticationManager, WLPermissionsConfig } from "./libraries/Web-Legos/api/auth.ts";
import { AnalyticsManager } from "./libraries/Web-Legos/api/analytics.ts";
import { umamiConfigFor } from "./libraries/Web-Legos/api/umamiRegistry.ts";
import { MailManager } from "./libraries/Web-Legos/api/mail.ts";
import { CmsManager } from "./libraries/Web-Legos/api/cms.ts";
import { configureAuthClient, configureFormsClient } from "./libraries/Web-Legos/api/services.ts";

// Component Imports
import { SiteHeader } from "./components/SiteHeader.jsx";
import { SiteFooter } from "./components/SiteFooter.jsx";
import Home from "./routes/Home.jsx";
import BookOnline from "./routes/BookOnline.jsx";
import { EditPermissionsProvider } from "./api/permissions.jsx";

export const SITE_SLUG = "room01890";

/** Context to keep track of current user */
export const CurrentSignInContext = createContext();

/** Context to keep track whether we're running tests right now */
export const TestingContext = createContext();

/** Site AuthenticationManager */
const authenticationManager = new AuthenticationManager(firebaseConfig, new WLPermissionsConfig());
authenticationManager.initialize();

/** Site AnalyticsManager */
const analyticsManager = new AnalyticsManager(umamiConfigFor(SITE_SLUG));
analyticsManager.initialize();

/** Inquiry-form notifications (site-mail profile SITE_ROOM01890_*). */
export const R01MailManager = new MailManager({ site: SITE_SLUG });
R01MailManager.addRecipientEmail("info@room01890.com");
R01MailManager.addHiddenRecipient("joedobbelaar@gmail.com");

CmsManager.configure({ site: SITE_SLUG });
configureAuthClient({ site: SITE_SLUG });
configureFormsClient({ site: SITE_SLUG });

/** Scroll to the top on page changes, or to #anchor when the URL has one (e.g. "Inquiry" → /#contact). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // Wait a frame so the target section has rendered.
    const id = decodeURIComponent(hash.slice(1));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }));
  }, [pathname, hash]);
  return null;
}

export function App(props) {
  const [currentSignIn, setCurrentSignIn] = useState(null);

  /** Whether this is a testing environment */
  const isTestingEnvironment = props.isTestingEnvironment;

  /** Wraps children in all app contexts. Called as a function (not a component) so the tree isn't remounted on re-render. */
  function withContexts(children) {
    return (
      <AuthenticationManager.Context.Provider value={{ authenticationManager }}>
        <AnalyticsManager.Context.Provider value={{ analyticsManager }}>
          <TestingContext.Provider value={{ isTestingEnvironment }}>
            <CurrentSignInContext.Provider value={{ currentSignIn, setCurrentSignIn }}>
              <EditPermissionsProvider>{children}</EditPermissionsProvider>
            </CurrentSignInContext.Provider>
          </TestingContext.Provider>
        </AnalyticsManager.Context.Provider>
      </AuthenticationManager.Context.Provider>
    );
  }

  // If we're testing, just place everything in context provider
  if (props.children) {
    return withContexts(
      <>
        {isTestingEnvironment && <meta data-testid="wl-testing-flag" />}
        {props.children}
      </>
    );
  }

  return (
    <div className="r01-app" data-testid="app">
      {withContexts(
        <>
        {isTestingEnvironment && <meta data-testid="wl-testing-flag" />}
        <Router>
          <ScrollManager />
          <a href="#main" className="r01-skip">Skip to Main Content</a>
          <SiteHeader />
          <main id="main" className="r01-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book-online" element={<BookOnline />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <SiteFooter />
        </Router>
        </>
      )}
    </div>
  );
}

export default App;
