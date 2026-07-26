import React from 'react'
import { CurrentUserContext } from '../../App'
import { ActionIcon, Avatar, Button, Divider, Modal, Paper, Text, TextInput, Tooltip } from '@mantine/core'
import { IconCheck, IconExternalLink, IconHistory, IconTrash, IconX } from '@tabler/icons-react'
import { notifSuccess, notifWarn } from '../Notifications'
import { LMSIcon } from '../LMS'
import { LinkMaster } from '../../api/links.ts'
import { getCalendarEvents } from '../../api/calendar.ts'
import IconButton from '../IconButton.jsx'
import { deleteButtonColor } from '../../api/color.ts'

export default function Intent({height, setTab}) {

  const {currentUser} = React.useContext(CurrentUserContext)
  const delegateUser = currentUser.delegate ? currentUser.delegate : currentUser;


  const welcomeText = `Welcome back, ${currentUser.personalData.displayName.split(" ")[0]}!`

  const intentText = (delegateUser.intents && delegateUser.intents[0]);

  const [newIntentText, setNewIntentText] = React.useState(null)

  const [nextMeetingTime, setNextMeetingTime] = React.useState(null)

  React.useEffect(() => {
    getCalendarEvents(delegateUser.personalData.email).then(events => {
      let d = events.events[0]?.start?.date
      if (d) {
        d = d.substring(5, 10)
        d = d.replace("-", "/");
        setNextMeetingTime(d);
      } else {
        setNextMeetingTime(null);
      }
    })
  }, [delegateUser.personalData.email])

  const IntentTextDisplay = () => {
    if (newIntentText !== null) { return; }
    if (currentUser.delegate) {
      return <Text className="text-center mb-2 intent-text disable-interaction">{ intentText || `${delegateUser.personalData.displayName} has not set an intent yet!` }</Text>
    }
    return <Text className="text-center mb-2 intent-text">{ intentText || "You haven't set an intent yet!" }</Text>
  }

  function updateIntent() {
    if (currentUser.delegate) { return; }
    if (newIntentText === null) { return; }
    if (newIntentText.length === 0) {
      notifWarn("Intent Not Updated", "Your intent cannot be empty!");
      return;
    }
    currentUser.setIntent(newIntentText).then(() => {
      notifSuccess("Intent Updated", "Your intent has been updated!");
      setNewIntentText(null);
    })
  }

  function handleEnter(e) { if (e.key === "Enter") { updateIntent(); } }

  const IntentSubmit = () => ( 
    <Tooltip label="Submit">
      <ActionIcon onClick={() => updateIntent()}>
        <IconCheck />
      </ActionIcon>
    </Tooltip>  
  )

  const IntentCancel = () => ( 
    <Tooltip label="Cancel">
      <ActionIcon onClick={() => setNewIntentText(null)}>
        <IconX />
      </ActionIcon>
    </Tooltip>  
  )

  const [intentHistoryOpen, setIntentHistoryOpen] = React.useState(false)

  const IntentHistoryButton = () => (
    <Tooltip label="See Intent History" position='bottom'>
      <ActionIcon onClick={() => setIntentHistoryOpen(true)}>
        <IconHistory />
      </ActionIcon>
    </Tooltip>
  )

  const meetingText = nextMeetingTime ? `${!currentUser.delegate ? "Your" : delegateUser.personalData.displayName + "'s"} next meeting is ${nextMeetingTime}.` : "No next meeting scheduled."

  function handleClick(e) {
    if (newIntentText !== null) { return; }
    setNewIntentText("");
  }

  const lmsName = delegateUser ? delegateUser.schoolInfo.LMSName : currentUser.schoolInfo.LMSName;
  const lmsLink = delegateUser ? delegateUser.schoolInfo.LMSHref : currentUser.schoolInfo.LMSHref;

  const userHasMeetingLink = currentUser?.settings?.meetingLink;

  function handleMeetingLinkClick() {
    if (currentUser?.settings?.meetingLink) { window.open(LinkMaster.ensureAbsoluteUrl(currentUser.settings.meetingLink, "_blank")); return; }
    setTab("settings");
  }

  function handleLMSLinkClick() {
    if (lmsLink) { window.open(LinkMaster.ensureAbsoluteUrl(lmsLink, "_blank")); return; }
    setTab("settings");
  }

  return (
    <Paper withBorder style={{height: height}} className="w-100 p-2 d-flex flex-column text-center align-items-center justify-content-start top-green mb-xl-2">
      <Modal opened={intentHistoryOpen} onClose={() => setIntentHistoryOpen(false)} title="Intent History" size="md">
        {currentUser.intents.map((intent, index) => {
          
          function deleteIntent() {
            currentUser.intents.splice(index, 1);
            currentUser.setData().then(() => {
              notifSuccess("Intent Deleted", `"${intent}" has been removed from your history.`);
            })
          }

          return (
            <div className='d-flex flex-column gap-2 w-100 mt-2' key={index}>
              <div className="d-flex flex-row align-items-center justify-content-between">
                <Text>{intent}</Text>
                <IconButton icon={<IconTrash />} label="Delete Intent" color={deleteButtonColor} onClick={deleteIntent} />
              </div>
              <Divider />
            </div>
            )
          }
        )}
      </Modal>
      <Avatar src={currentUser.personalData.pfpUrl} alt={currentUser.personalData.displayName} size="large" />
      <Text size="xl">{welcomeText}</Text>
      <Text c="dimmed">{meetingText}</Text>
      <div className={"container d-flex flex-row " + (newIntentText === null ? "intent-container" : "")} onClick={handleClick}>
        <div className="col-1 gap-2 d-flex flex-column align-items-center justify-content-between py-2">
          {quoteSvg}
        </div>
        <div className="col-10 p-2 gap-2 d-flex flex-column intent-edit-container align-items-center justify-content-center">
          <IntentTextDisplay />
          { newIntentText !== null && <TextInput placeholder="What's your intent?" className="w-100" value={newIntentText} onKeyDown={handleEnter} onChange={(e) => setNewIntentText(e.target.value)} /> }
          { newIntentText !== null && <div className="d-flex gap-2"><IntentSubmit /><IntentCancel /><IntentHistoryButton /></div> }
        </div>
        <div className="col-1 gap-2 d-flex flex-column align-items-center justify-content-start py-2">
          {quoteRightSvg}
        </div>
      </div>
      <div className="row w-100 gap-2">
        <div className="col-12">
          <Button rightSection={lmsLink ? <LMSIcon name={lmsName} /> : ""} onClick={handleLMSLinkClick}>
            {lmsLink ? `Go to ${(lmsName !== "Other" && lmsName !== "") ? lmsName : "LMS"}` : "Set LMS"}
          </Button>
        </div>
        {!currentUser.delegate && <div className="col-12">
          <Button rightSection={userHasMeetingLink ? <IconExternalLink size="1rem" /> : ""} onClick={handleMeetingLinkClick}>
            {userHasMeetingLink ? "Join Meeting" : "Set Meeting Link"}
          </Button>
        </div>}
        <div className="col-12">
          {delegateUser?.schoolInfo?.sessionNotes && <Button rightSection={<IconExternalLink size="1rem" />} onClick={() => window.open(LinkMaster.ensureAbsoluteUrl(currentUser.schoolInfo.sessionNotes, "_blank"))}>
            Session Notes
          </Button>}
        </div>
      </div>
    </Paper>
  )
}



const quoteSvg = (
  <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{borderRadius: "50%", maxWidth: 50}}>
    <path fill="#D6E3D1" d="M30,20.07C23.8,22.7,19.19,26.26,19.19,31.52c0,4.6,4.35,5.65,8.81,6.7.8.13,1.72,2,1.72,3.56,0,3.54-2.77,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.41-15.52,16.83-17.88Zm23.16,0C47,22.7,42.34,26.26,42.34,31.52c0,4.6,4.47,5.65,8.95,6.7.79.13,1.71,2,1.71,3.56,0,3.54-2.89,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.42-15.52,16.83-17.88Z"></path>
  </svg>
)

const quoteRightSvg = (
  <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{transform:"scale(-1,1)", borderRadius: "50%", maxWidth: 50}}>
    <path fill="#D6E3D1" d="M30,20.07C23.8,22.7,19.19,26.26,19.19,31.52c0,4.6,4.35,5.65,8.81,6.7.8.13,1.72,2,1.72,3.56,0,3.54-2.77,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.41-15.52,16.83-17.88Zm23.16,0C47,22.7,42.34,26.26,42.34,31.52c0,4.6,4.47,5.65,8.95,6.7.79.13,1.71,2,1.71,3.56,0,3.54-2.89,5.91-6.71,5.91-5.79,0-11.57-4.73-11.57-13.41,0-9.34,8.42-15.52,16.83-17.88Z"></path>
  </svg>
)