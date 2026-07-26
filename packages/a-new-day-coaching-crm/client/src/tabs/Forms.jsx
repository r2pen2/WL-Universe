// Library Imports
import {Paper, Text, Tooltip } from '@mantine/core'
import React, { memo, useContext, useEffect, useMemo, useState } from 'react'
import { IconAlertCircle, IconCircleCheckFilled, IconMoon } from '@tabler/icons-react'
import Confetti from "react-confetti"

// Component Imports
import { CurrentUserContext } from '../App'

// API Imports
import { hostname } from '../api/db/dbManager.ts'

// Style Imports
import "../assets/style/forms.css"
import { notifSuccess } from '../components/Notifications.jsx'
import { getFormById } from '../api/forms.ts'
import { FormCard } from '../components/forms/FormCard.jsx'

/** How much confetti to add when a form is completed */
const dConfetti = 500;

export default function Forms() {

  /** Current user */
  const {currentUser} = useContext(CurrentUserContext)
  
  /** How much confetti to throw */
  const [confettiLeft, setConfettiLeft] = useState(0);

  useEffect(() => {
    if (!currentUser) { return; }
    fetch(`${hostname}/forms/confetti?userId=${currentUser.id}`).then(res => res.json()).then(data => {
      if (data.formId) {
        setConfettiLeft(confettiLeft + dConfetti);
        notifSuccess("Form Completed", `Thanks for completing ${getFormById(data.formId).formTitle}! 🎉`)
      }
    })
  }, [currentUser, confettiLeft]);
  
  const formsMemo = useMemo(() => currentUser.formAssignments, [currentUser.formAssignments])

  return (
    <div>
      <Confetti recycle={false} numberOfPieces={confettiLeft} />
      <div className="container-fluid">
        <div className="row pt-2">
          <FormsDisplay forms={formsMemo}/>
        </div>
      </div>
    </div>
  )
}

  /** List of all forms. Clicking a form brings the user to the Google Form in a new tab */
const FormsDisplay = memo(function FormsDisplay({forms}) {

    if (forms.length < 1) { 
      return <div className="text-center">
        <IconMoon />
        <Text>There's nothing for you to complete!</Text>
      </div>
    }

    return (
      forms.map((form, index) => <div className="col-12 col-xl-3 mb-2" key={index}><FormCard form={form} /></div>)
    )
  }
)