import { Button, Spacer, } from '@nextui-org/react'
import React from 'react'
import logo from "../assets/images/logoTransparent.png";
import { mailingListLink, facebookLink, instagramLink, tiktokLink, youtubeLink } from '../api/links';
import {  WLFooterLogo, WLFooterSignature, WLFooterSocials } from '../libraries/Web-Legos/components/Footer';
import { WLCopyright, WLText } from '../libraries/Web-Legos/components/Text';
import { FooterAuthButton } from '../libraries/Web-Legos/components/Auth';
import { useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { useEffect } from 'react';
import { useState } from 'react';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';

export default function Footer() {

  const {currentSignIn, setCurrentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);

  
  return (
    <footer>
      <div className="footer-content w-100" >
        <div className="container-fluid mt-3 mb-3 d-flex flex-column align-items-center">
          <NewFooterContent />
        </div>
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
  const {authenticationManager} = useContext(AuthenticationManager.Context);
    
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);


  return <WLCopyright editable={userCanEditText} />
}

function NewFooterContent() {  

    const {currentSignIn} = useContext(CurrentSignInContext);
    const {authenticationManager} = useContext(AuthenticationManager.Context);
  
    const [userCanEditText, setUserCanEditText] = useState(false);
    
    useEffect(() => {
      authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    }, [authenticationManager, currentSignIn]);

  return (
    <div className="row d-flex flex-row w-100 align-items-center gap-5 justify-content-center">
      <div className="col-lg-12 col-xl-3 d-flex flex-column align-items-center">
        <WLFooterLogo source={logo} />
        <WLText firestoreId="footer-contact" editable={userCanEditText} />
      </div>
      <div className="col-lg-12 col-xl-4 d-flex flex-column align-items-center">
        <WLFooterSocials lineBottom>
          <WLFooterSocials.Button platformKey="instagram" href={instagramLink} />
          <WLFooterSocials.Button platformKey="facebook" href={facebookLink} />
          <WLFooterSocials.Button platformKey="tiktok" href={tiktokLink} />
          <WLFooterSocials.Button platformKey="youtube" href={youtubeLink} />
        </WLFooterSocials>
        <WLText editable={userCanEditText} firestoreId="footer-follower-count" />
        <Spacer y={1} />
        <Button flat onClick={() => window.open(mailingListLink, "_blank")}>
          Join my Mailing List
        </Button>
      </div>
      <div className="col-lg-12 col-xl-3 d-flex flex-column align-items-center">
        <WLText firestoreId="footer-hook" editable={userCanEditText} />
      </div>
    </div>
  )
}