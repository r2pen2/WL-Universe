import { createContext, useContext, useEffect, useState } from "react";
import { CurrentSignInContext } from "../App.jsx";
import { AuthenticationManager } from "../libraries/Web-Legos/api/auth.ts";

const NONE = { text: false, images: false };
const EditPermissionsContext = createContext(NONE);

/**
 * Looks up once (per sign-in) whether the user may edit site text / images (wl-auth
 * permissions; joed.dev SSO admins get both) and shares it with every WL element below.
 */
export function EditPermissionsProvider({ children }) {
  const { currentSignIn } = useContext(CurrentSignInContext);
  const { authenticationManager } = useContext(AuthenticationManager.Context);
  const [permissions, setPermissions] = useState(NONE);

  useEffect(() => {
    let cancelled = false;
    if (!currentSignIn) {
      setPermissions(NONE);
      return;
    }
    Promise.all([
      authenticationManager.getPermission(currentSignIn, "siteText"),
      authenticationManager.getPermission(currentSignIn, "siteImages"),
    ]).then(([text, images]) => {
      if (!cancelled) setPermissions({ text: Boolean(text), images: Boolean(images) });
    });
    return () => {
      cancelled = true;
    };
  }, [currentSignIn, authenticationManager]);

  return <EditPermissionsContext.Provider value={permissions}>{children}</EditPermissionsContext.Provider>;
}

/** @returns {{ text: boolean, images: boolean }} */
export function useEditPermissions() {
  return useContext(EditPermissionsContext);
}
