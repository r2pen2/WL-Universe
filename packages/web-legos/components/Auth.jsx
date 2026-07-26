import { useEffect } from "react";

import { AuthenticationManager } from "../api/auth.ts";
import { signOut } from "firebase/auth";
import { Button, Link, Text } from "@nextui-org/react";

/**
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {FirebaseAuthentication} currentSignIn - currently signed in user state
 * @param {Function} setCurrentSignIn - currently signed in user state setter function
 * @param {boolean} link - whether to display as link
 * @param {string} color - link color
 */
export function FooterAuthButton({authManager, currentSignIn, setCurrentSignIn, link, color}) {

  // Update sign-in state on authentication change
  useEffect(() => {
    authManager.auth.onAuthStateChanged(u => {
      setCurrentSignIn(u);
    })
  }, [authManager, setCurrentSignIn])

  function handleSignInClick() {
    if (authManager.auth.currentUser) {
      setCurrentSignIn(null);
      signOut(authManager.auth).then(() => {
        window.location.reload();
      });
    } else {
      authManager.signInWithGoogle().then(authUser => {
        setCurrentSignIn(authUser);
        if (authUser) {
          const uid = authUser.uid;
          const displayName = authUser.displayName;
          authManager.createNewUser(uid, displayName, authUser.email);
        }
      }).catch((err) => {
        console.warn(err);
        setCurrentSignIn(null);
      });
    }
  }

  const buttonText = currentSignIn ? `Signed in as ${currentSignIn.displayName}` : "Admin Login";

  if (link) {
    return (
      <Text aria-label="admin-login-button" onClick={handleSignInClick} color={color} css={{cursor: "pointer", textDecoration:"underline"}}>
        {buttonText}
      </Text>
    )
  }

  return (
    <Button aria-label="admin-login-button" light onClick={handleSignInClick}>
      {buttonText}
    </Button>
  )
}
