import React, { useState } from 'react'

import "../assets/style/services.css"

import { WLBlockHeader, WLHeaderV2 } from '../libraries/Web-Legos/components/Text';

import { blockHeaderFill } from "../assets/style/colors";
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { useEffect, useContext } from 'react';
import { CurrentSignInContext } from '../App';
import { AuthenticationManager } from '../libraries/Web-Legos/api/auth.ts';
import { AnalyticsManager } from '../libraries/Web-Legos/api/analytics.ts';
import { FAQItem } from '../api/siteModels.ts';
import { Spacer, Text } from '@nextui-org/react';
import { AddModelButton, ModelEditButton, ModelEditModal } from '../libraries/Web-Legos/components/Modals';
import { SiteModel } from '../libraries/Web-Legos/api/models.ts';

export default function FAQ() {  

  const {currentSignIn} = useContext(CurrentSignInContext);
  const {authenticationManager} = useContext(AuthenticationManager.Context);
  const {analyticsManager} = useContext(AnalyticsManager.Context);

  analyticsManager.logPageView("faq")

  const [FAQItems, setFAQItems] = useState([]);

  const [userCanEditText, setUserCanEditText] = useState(false);
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
    FAQItem.getAndSet(setFAQItems, setFAQLoaded)
    // setFAQItems([FAQItem.examples.default, FAQItem.examples.default])
  }, [authenticationManager, currentSignIn]);

  const [currentModel, setCurrentModel] = useState(new SiteModel())
  const [modelEditModalOpen, setModelEditModalOpen] = useState(false)


  const [FAQLoaded, setFAQLoaded] = useState(false);

  const FAQRender = ({faqItem, editable}) => [
    <dt className="w-100 d-flex flex-row align-items-center justify-content-center" style={{maxWidth: 1200}}>
      <Text style={{fontSize:"1.5rem"}} align="center">{faqItem.question}</Text>
      <Spacer x={1} />
      <div className="fill-line"></div>
      { editable && <ModelEditButton data={faqItem} userCanEdit={editable} model={FAQItem} small setEditModalOpen={setModelEditModalOpen} setCurrentModel={setCurrentModel}  />}
    </dt>,
    <dd className="w-100 d-flex flex-row align-items-center justify-content-start" style={{maxWidth: 1200}}>
      <Text align="left">
        <span style={{color: "#8A4FCC"}}>A: </span>
        {faqItem.answer}
      </Text>
    </dd>
  ]

  return (
  <WLSpinnerPage dependencies={[FAQLoaded]}>
    <WLBlockHeader text="Frequently Asked Questions" color={blockHeaderFill} short />
    <ModelEditModal model={currentModel} open={modelEditModalOpen} setOpen={setModelEditModalOpen} />
    <dl className="d-flex flex-column align-items-center justify-content-center w-100 px-2 px-md-4">
      {FAQItems.map((f, i) => <FAQRender faqItem={f} key={i} editable={userCanEditText}/>)}
    </dl>
    <div className="d-flex flex-row align-items-center justify-content-center">
      <AddModelButton userCanEdit={userCanEditText} model={FAQItem} setCurrentModel={setCurrentModel} setEditModalOpen={setModelEditModalOpen} />
    </div>
    </WLSpinnerPage>
  )
}