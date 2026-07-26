import React, { useContext, useState } from 'react'

import { Divider } from "@nextui-org/react";

import "../assets/style/services.css"
import { ScheduleBar } from '../components/Forms';
import { WLHeader, WLText } from '../libraries/Web-Legos/components/Text';
import { AuthenticationManagerContext, CurrentSignInContext } from '../App';
import { WLResponsiveSectionEditable, WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { ServicesBlockHeader } from '../components/Bar';
import { useEffect } from 'react';

export default function Services() {

  const [afterSchoolLoaded, setAfterSchoolLoaded] = useState(false);
  const [tutoringLoaded, setTutoringLoaded] = useState(false);
  const [wilsonTutoringLoaded, setWilsonTutoringLoaded] = useState(false);

  // Get current user from context
  const { currentSignIn } = useContext(CurrentSignInContext);
  const { authenticationManager } = useContext(AuthenticationManagerContext);

  // User Permissions
  const [userCanEditText, setUserCanEditText] = useState(false);
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p))
  }, [authenticationManager, currentSignIn]);

  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <WLSpinnerPage dependencies={[afterSchoolLoaded, tutoringLoaded, wilsonTutoringLoaded]}>
      <ServicesBlockHeader />
      <WLResponsiveSectionEditable 
        setLoaded={setAfterSchoolLoaded}
        firestoreId="social-skills" 
        editable={userCanEditText}
        stackHeader
        bottomContent={
            <div className="py-5 d-flex flex-column align-items-center justify-content-center w-100">
              <div className="d-flex flex-column align-items-center justify-content-center" style={{maxWidth: 1400}}>
                <WLHeader headerLevel={2} color="primary" firestoreId="social-skills-details-header" editable={userCanEditText}/>
                <Divider css={{marginBottom: "2rem"}}/>
                <WLText editable={userCanEditText} firestoreId="social-skills-details" />
              </div>
            </div>
          }
      />
      <div className="rainbow-line"/>
      <WLResponsiveSectionEditable 
        setLoaded={setTutoringLoaded}
        firestoreId="1-on-1-tutoring" 
        editable={userCanEditText} 
        stackHeader
        bottomContent={
          <div className="py-5 d-flex flex-column align-items-center justify-content-center w-100">
            <div className="d-flex flex-column align-items-center justify-content-center" style={{maxWidth: 1400}}>
              <WLHeader headerLevel={2} color="primary" firestoreId="1-on-1-tutoring-details-header" editable={userCanEditText}/>
              <Divider css={{marginBottom: "2rem"}}/>
              <WLText editable={userCanEditText} firestoreId="1-on-1-tutoring-details" />
            </div>
          </div>
        }
      />
      <div className="rainbow-line"/>
      <WLResponsiveSectionEditable 
        setLoaded={setWilsonTutoringLoaded}
        firestoreId="wilson-tutoring" 
        editable={userCanEditText}
        stackHeader
        bottomContent={
          <div className="py-5 d-flex flex-column align-items-center justify-content-center w-100">
            <div className="d-flex flex-column align-items-center justify-content-center" style={{maxWidth: 1400}}>
              <WLHeader headerLevel={2} color="primary" firestoreId="wilson-tutoring-details-header" editable={userCanEditText}/>
              <Divider css={{marginBottom: "2rem"}}/>
              <WLText editable={userCanEditText} firestoreId="wilson-tutoring-details" />
            </div>
          </div>
        }
      />
      <ScheduleBar open={formModalOpen} setOpen={setFormModalOpen} />
    </WLSpinnerPage>
  )
}