import './App.css';
import { Navbar } from './components/Navbar';

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import HomePage from "./routes/HomePage";
import Footer from './components/Footer';
import About from './routes/About';
import Services from './routes/Services';
import Contact from './routes/Contact';
import ThankYou from './routes/ThankYou';
import Gallery from './routes/Gallery';
import { createContext, useEffect, useState } from 'react';
import { auth, firestore } from './api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MailManager } from './libraries/Web-Legos/api/mail.ts';
import { AuthenticationManager, WLPermissionsConfig } from "./libraries/Web-Legos/api/auth.ts"

export const serverURL = '/';

export const CurrentSignInContext = createContext(null);

export const BTBMailManager = new MailManager();
BTBMailManager.addRecipientEmail("joedobbelaar@gmail.com");
BTBMailManager.addRecipientEmail("nancy@beyondthebelleducation.com");

export const AuthenticationManagerContext = createContext(null);

function App() {

  const permissions = new WLPermissionsConfig({
    testimonials: "testimonials",
    offerings: "offerings",
    staff: "staff",
  })
  const authenticationManager = new AuthenticationManager(
    {
      apiKey: "AIzaSyCIZYHsbNNMhRviRcaeyrpYDQ73AwLrapk",
      authDomain: "beyond-the-bell-20097.firebaseapp.com",
      projectId: "beyond-the-bell-20097",
      storageBucket: "beyond-the-bell-20097.appspot.com",
      messagingSenderId: "977570434108",
      appId: "1:977570434108:web:7a2ba50a64da35619ec739"
    },
    permissions
  )
  authenticationManager.initialize()

  const [currentSignIn, setCurrentSignIn] = useState(null);

  return (
    <AuthenticationManagerContext.Provider value={{authenticationManager}} >
    <CurrentSignInContext.Provider value={{currentSignIn, setCurrentSignIn}} >
      <div className="App d-flex flex-column align-items-center w-100">
      <Router>
        <div className="app-content">
          <Navbar />
            <Routes>
              <Route path="*" element={<HomePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/gallery" element={<Gallery />} />
            </Routes>
          <Footer />
        </div>
      </Router>
      </div>
    </CurrentSignInContext.Provider>
    </AuthenticationManagerContext.Provider>
  );
}

export default App;
