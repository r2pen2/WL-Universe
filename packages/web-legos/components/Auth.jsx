import { useEffect, useState } from "react";

import { AuthenticationManager } from "../api/auth.ts";
import { signOut } from "firebase/auth";
import { Button, Link, Text } from "@nextui-org/react";

/** Where site admins file content change requests: the Web Legos project in Plane (joed.dev SSO). */
export const CHANGE_REQUESTS_URL = "https://plane.joed.dev/main/projects/6ca472a9-89a5-406f-9b6c-ff3039d6ffb2/issues/";

/**
 * Whether the signed-in user is an admin of this site (holds any wl-auth permission).
 * @param {AuthenticationManager} authManager - AuthenticationManager instance for this site
 * @param {FirebaseAuthentication} currentSignIn - currently signed in user state
 * @returns {boolean} false until confirmed, and whenever signed out
 */
export function useIsSiteAdmin(authManager, currentSignIn) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(false);
    if (!authManager || !currentSignIn || !currentSignIn.uid) { return; }
    let cancelled = false;
    authManager.isSiteAdmin(currentSignIn).then((admin) => {
      if (!cancelled) { setIsAdmin(admin); }
    });
    return () => { cancelled = true; };
  }, [authManager, currentSignIn]);

  return isAdmin;
}

/**
 * Opens Plane, where site admins file and track content change requests.
 * FooterAuthButton shows it automatically under the sign-in for admins.
 * @param {boolean} link - whether to display as link
 * @param {string} color - link color
 */
export function RequestChangesButton({link, color}) {
  const buttonText = "Request content changes";

  if (link) {
    return (
      <Link aria-label="request-content-changes-button" href={CHANGE_REQUESTS_URL} target="_blank" rel="noopener noreferrer" css={{color, textDecoration: "underline"}}>
        {buttonText}
      </Link>
    )
  }

  return (
    <Button aria-label="request-content-changes-button" light onClick={() => window.open(CHANGE_REQUESTS_URL, "_blank", "noopener,noreferrer")}>
      {buttonText}
    </Button>
  )
}

/**
 * Admin sign-in/sign-out control for site footers. When an admin of the site is signed in, a
 * RequestChangesButton appears directly under it.
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

  const isAdmin = useIsSiteAdmin(authManager, currentSignIn);

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

  const authControl = link ? (
    <Text aria-label="admin-login-button" onClick={handleSignInClick} color={color} css={{cursor: "pointer", textDecoration:"underline"}}>
      {buttonText}
    </Text>
  ) : (
    <Button aria-label="admin-login-button" light onClick={handleSignInClick}>
      {buttonText}
    </Button>
  );

  // Visitors get exactly the control they always did; admins get the request button stacked under it.
  if (!isAdmin) {
    return authControl;
  }

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
      {authControl}
      <RequestChangesButton link={link} color={color} />
    </div>
  )
}
