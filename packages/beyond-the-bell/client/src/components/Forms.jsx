import { Button, } from "@nextui-org/react"

import { ScholarshipIcon, SchoolDaysIcon, iconFills } from './Icons';

import { applicationLink, scholarshipLink } from '../api/links';
import { OrangeBar } from "./Bar";
import { WLHeaderV2 } from "../libraries/Web-Legos/components/Text";
import { useContext } from "react";
import { AuthenticationManagerContext, CurrentSignInContext } from "../App";
import { CardModal } from "../libraries/Web-Legos/components/Modals";
import { useState } from "react";
import { useEffect } from "react";

export function ScheduleBar({open, setOpen}) {


  const { currentSignIn } = useContext(CurrentSignInContext)
  const { authenticationManager } = useContext(AuthenticationManagerContext)

  const [userCanEditText, setUserCanEditText] = useState(false);
  
  useEffect(() => {
    authenticationManager.getPermission(currentSignIn, "siteText").then(p => setUserCanEditText(p));
  }, [authenticationManager, currentSignIn]);

  return (
    <div>
      <section>
        <OrangeBar>
          <WLHeaderV2 size="$2xl" firestoreId="call-to-action" editable={userCanEditText} color="white"/>
          <Button size="xl" bordered color="gradient" shadow onClick={() => setOpen(true)}>
            Schedule A Session
          </Button>
        </OrangeBar>
      </section>
      <FormModal open={open} setOpen={setOpen}/>
    </div>
  )
}

export function FormModal({open, setOpen}) {

  return (
    <CardModal open={open} setOpen={setOpen} >
      <CardModal.Item 
        icon={<SchoolDaysIcon marginRight="1rem" fill={iconFills.orange} size={"3rem"} />}
        title="BTB Student Application"
        subtitle="Click to open application" 
        href={applicationLink}
      />
      <CardModal.Item 
        icon={<ScholarshipIcon marginRight="1rem" fill={iconFills.green} size={"3rem"} />}
        title="The Little Fiddle Scholarship"
        subtitle="Click to open application" 
        href={scholarshipLink}
      />
    </CardModal>
  )
}