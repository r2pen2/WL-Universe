import { Button, } from "@nextui-org/react"

import { OrangeBar } from "./Bar";
import { WLHeaderV2 } from "../libraries/Web-Legos/components/Text";
import { useContext } from "react";
import { AuthenticationManagerContext, CurrentSignInContext } from "../App";
import { useState } from "react";
import { useEffect } from "react";

export function ScheduleBar() {

  const { currentSignIn } = useContext(CurrentSignInContext)
  const { authenticationManager } = useContext(AuthenticationManagerContext)

  const [userCanEditText, setUserCanEditText] = useState(false);

  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);

  return (
    <section>
      <OrangeBar>
        <WLHeaderV2 size="$2xl" firestoreId="call-to-action" editable={userCanEditText} color="white"/>
        <Button size="xl" bordered color="gradient" shadow onClick={() => window.location.href = "/#contact"}>
          Contact Us
        </Button>
      </OrangeBar>
    </section>
  )
}