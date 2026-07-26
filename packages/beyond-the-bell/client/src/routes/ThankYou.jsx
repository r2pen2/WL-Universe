import React, { useContext, useState } from 'react'

import "../assets/style/services.css"
import { CurrentSignInContext, AuthenticationManagerContext } from '../App';
import { WLText } from '../libraries/Web-Legos/components/Text';
import { WLSpinnerPage } from '../libraries/Web-Legos/components/Layout';
import { WLImage } from '../libraries/Web-Legos/components/Images';
import { ThankYouBlockHeader } from '../components/Bar';
import { useEffect } from 'react';

import Confetti from 'react-confetti'
// import useWindowSize from 'react-use/lib/useWindowSize'

export default function ThankYou() {

  // const { width, height } = useWindowSize()

  const [thankYouTextLoaded, setThankYouTextLoaded] = useState(false);

  // Get current user from context
  const { currentSignIn } = useContext(CurrentSignInContext);
  const { authenticationManager } = useContext(AuthenticationManagerContext);

  // User Permissions
  const [userCanEditText, setUserCanEditText] = useState(false);
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p))
  }, [authenticationManager, currentSignIn]);

  return (
    <WLSpinnerPage itemsCentered dependencies={[thankYouTextLoaded]}>
      <Confetti
        numberOfPieces={500}
        recycle={false}
      />
      <ThankYouBlockHeader />
      <section className="d-flex flex-column align-items-center justify-content-center m-5 gap-2">
        <WLText firestoreId="thank-you" editable={userCanEditText} setLoaded={setThankYouTextLoaded}/>
        <WLImage editable={userCanEditText} firestoreId="thank-you" shadow />
      </section>
    </WLSpinnerPage>
  )
}