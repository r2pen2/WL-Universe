import './App.css';
import { Navbar } from './components/Navbar';

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import HomePage from "./routes/HomePage";
import About from './routes/About';
import Services from './routes/Services';
import Resources from './routes/Resources';
import FindMe from './routes/FindMe';
import Footer from './components/Footer';
import Gallery from './routes/Gallery';
import FAQ from "./routes/FAQ";
import { AuthenticationManager, WLPermissionsConfig } from './libraries/Web-Legos/api/auth.ts';
import { createContext, useLayoutEffect } from 'react';
import { useState } from 'react';
import { themeLarge } from './assets/style/theme';
import { NextUIProvider } from '@nextui-org/react';
import { AnalyticsManager } from './libraries/Web-Legos/api/analytics.ts';
import { firebaseConfig } from './api/firebase.ts';

export const CurrentSignInContext = createContext(null);

const permissions = new WLPermissionsConfig({
  beforesAndAfters: "befores-and-afters",
  galleryVideo: "gallery-video",
  galleryPictures: "gallery-pictures",
  serviceItems: "service-items",
  mediaAppearances: "media-appearances",
  teachingItems: "teaching-items",
  testimonials: "testimonials",
  externalResources: "external-resources",
})

const authenticationManager = new AuthenticationManager(
  firebaseConfig, permissions
);
authenticationManager.initialize();

const analyticsManager = new AnalyticsManager(firebaseConfig)
analyticsManager.initialize();

function App() {

  const [currentSignIn, setCurrentSignIn] = useState(null);

  function updateTheme() {
    if (window.innerWidth <= 768) {
      document.getElementById("root-element").setAttribute("style", "color-scheme: light; font-size: 18px;")
    } else {
      document.getElementById("root-element").setAttribute("style", "color-scheme: light; font-size: 20px;")
    }
  }
  
  useLayoutEffect(() => {
    updateTheme();
    window.addEventListener('resize', updateTheme)
  }, [])

  return (
    <NextUIProvider theme={themeLarge}>

    <AnalyticsManager.Context.Provider value={{analyticsManager}}>
    <AuthenticationManager.Context.Provider value={{authenticationManager}}>
    <CurrentSignInContext.Provider value={{currentSignIn, setCurrentSignIn}}>
      <div className="App d-flex flex-column align-items-center w-100">
        <Router>
          <div className="app-content">
            <Navbar />
              <Routes>
                <Route path="*" element={<HomePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                {/* <Route path="/resources" element={<Resources />} /> */}
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/find-me" element={<FindMe />} />
                <Route path="/faq" element={<FAQ />} />
              </Routes>
            <Footer/>
          </div>
        </Router>
      </div>
    </CurrentSignInContext.Provider>
    </AuthenticationManager.Context.Provider>
    </AnalyticsManager.Context.Provider>

    </NextUIProvider>
  );
}

export default App;
