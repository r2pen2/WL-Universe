import { Text, Link, Button } from '@nextui-org/react'
import React, {useState, useEffect, useContext} from 'react'
import logo from "../assets/images/LogoHD.png";
import footerBackground from "../assets/images/footerBackground.png";

import { signOut } from 'firebase/auth';
import { auth, signInWithGoogle } from '../api/firebase';
import { firestore } from '../api/firebase';
import { getDoc, doc, setDoc } from 'firebase/firestore';

import { AuthenticationManagerContext, CurrentSignInContext } from '../App';
import { WLText, WLCopyright, WLHeader } from '../libraries/Web-Legos/components/Text';
import { WLFooterSignature, WLFooterSocials } from '../libraries/Web-Legos/components/Footer';
import { platformKeys } from '../libraries/Web-Legos/components/Icons';
import { iconFills } from './Icons';
import { callLink, facebookLink, mailLink, mapsLink } from '../api/links';
import { FooterAuthButton } from '../libraries/Web-Legos/components/Auth';

export default function Footer() {

  const {currentSignIn, setCurrentSignIn} = useContext(CurrentSignInContext)
  const {authenticationManager} = useContext(AuthenticationManagerContext);
  
  return (
    <footer>
      <img src={footerBackground} className="footer-background" alt="footer-background" />
      <div className="footer-content w-100" >
        <FooterContent />
        <div className="fill-line mb-3" />
        <div className="d-flex flex-column gap-2 m-2 align-items-center">          
          <FooterCopyright />
          <FooterAuthButton authManager={authenticationManager} currentSignIn={currentSignIn} setCurrentSignIn={setCurrentSignIn}/>
        </div>
        <WLFooterSignature />
      </div>
    </footer>
  )
}

function FooterCopyright() {
  const [userCanEditText, setUserCanEditText] = useState(false);
  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManagerContext);
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);
  return <WLCopyright editable={userCanEditText} />
}

function FooterContent() {

  const {currentSignIn} = useContext(CurrentSignInContext)
  const {authenticationManager} = useContext(AuthenticationManagerContext);

  const [userCanEditText, setUserCanEditText] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);

  return (
    
    <div className="container-fluid mt-3 mb-3 d-flex flex-column align-items-center">
    <div className="row d-flex flex-row w-100 align-items-center gap-5 justify-content-center">
      <div className="col-lg-12 col-xl-3 d-flex flex-column align-items-center">
        <img src={logo} alt="logo-transparent" className="m-2" style={{width: 150, height: 150}}/>
        <WLHeader headerLevel={2}>
          Beyond the Bell Education
        </WLHeader>
        <WLText firestoreId="footer-contact" editable={userCanEditText} />
      </div>
      <div className="col-lg-12 col-xl-4 d-flex flex-column align-items-center">
        <WLHeader headerLevel={2}>
          Hours
        </WLHeader>
        <WLText firestoreId="footer-hours" editable={userCanEditText} />
        <WLFooterSocials lineTop>
            <WLFooterSocials.Button platformKey={platformKeys.PHONE} color={iconFills.orange} href={callLink}/>
            <WLFooterSocials.Button platformKey={platformKeys.MAIL} color={"#AB1CD6"} href={mailLink}/>
            <WLFooterSocials.Button platformKey={platformKeys.FACEBLOCK} href={facebookLink}/>
            <WLFooterSocials.Button platformKey={platformKeys.LOCATION} color={iconFills.green} href={mapsLink}/>
        </WLFooterSocials>
      </div>
      <div className="col-lg-12 col-xl-3 d-flex flex-column align-items-center">
        <Text>
          <Link block color="primary" href="/home">
            Home
          </Link>
        </Text>
        <Text>
          <Link block color="primary" href="/about">
            Who We Are
          </Link>
        </Text>
        <Text>
          <Link block color="primary" href="/services">
            Services
          </Link>
        </Text>
        <Text>
          <Link block color="primary" href="contact">
            Contact Us
          </Link>
        </Text>
      </div>
    </div>
  </div>
  )
}