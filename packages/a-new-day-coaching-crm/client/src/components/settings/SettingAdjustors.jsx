import { memo, useContext, useEffect, useState } from "react";
import { CurrentUserContext } from "../../App";
import { notifFail, notifSuccess } from "../Notifications";
import { Avatar, Badge, Group, Indicator, Paper, Select, Skeleton, Switch, Text, TextInput, Tooltip } from "@mantine/core";
import { updateAfterSwitchFlip } from "../../api/settings.ts";
import { LMSIcon } from "../LMS.jsx";
import { LMS, User } from "../../api/db/dbUser.ts";
import { HomeworkPriority, HomeworkPriorityVerbosity } from "../../api/db/dbHomework.ts";
import { LinkMaster } from "../../api/links.ts";
import { LinkedAccount } from "../userManagement/UserData.jsx";
import { IconCheck, IconPlus } from "@tabler/icons-react";

export const PersonalInformationSettings = memo(function PersonalInformationSettings({personalData}) {
  
  const {currentUser} = useContext(CurrentUserContext)
    
  const [tempDisplayName, setTempDisplayName] = useState(personalData.displayName)
  const [tempPhoneNumber, setTempPhoneNumber] = useState(personalData.phoneNumber)
  const [tempAddress, setTempAddress] = useState(personalData.address)
  const [tempCity, setTempCity] = useState(personalData.city)
  const [tempState, setTempState] = useState(personalData.state)
  const [tempZip, setTempZip] = useState(personalData.zip)

  function handleDisplayNameKeyDown(e) { if (e.key === "Enter") { handleSubmitDisplayName() } }
  function handlePhoneNumberKeyDown(e) { if (e.key === "Enter") { handleSubmitPhoneNumber() } }
  function handleAddressKeyDown(e) { if (e.key === "Enter") { handleSubmitAddress() } }
  function handleCityKeyDown(e) { if (e.key === "Enter") { handleSubmitCity() } }
  function handleStateKeyDown(e) { if (e.key === "Enter") { handleSubmitState() } }
  function handleZipKeyDown(e) { if (e.key === "Enter") { handleSubmitZip() } }

  function handleSubmitDisplayName() { 
    if (tempDisplayName === "") { return; }
    if (tempDisplayName === personalData.displayName) { return; }
    currentUser.changePersonalData('displayName', tempDisplayName);
    notifSuccess("Display Name Updated", `You will now be referred to as ${tempDisplayName}.`) 
  }

  function handleSubmitPhoneNumber() { 
    if (tempPhoneNumber === "") { return; }
    if (tempPhoneNumber === personalData.phoneNumber) { return; }
    currentUser.changePersonalData('phoneNumber', tempPhoneNumber);
    notifSuccess("Phone Number Updated", `Your phone number has been set to ${tempPhoneNumber}.`) 
  }

  function handleSubmitAddress() { 
    if (tempAddress === "") { return; }
    if (tempAddress === personalData.address) { return; }
    currentUser.changePersonalData('address', tempAddress);
    notifSuccess("Address Updated", `Your address has been set to ${tempAddress}.`) 
  }

  function handleSubmitCity() { 
    if (tempCity === "") { return; }
    if (tempCity === personalData.city) { return; }
    currentUser.changePersonalData('city', tempCity);
    notifSuccess("City Updated", `Your city has been set to ${tempCity}.`) 
  }

  function handleSubmitState() { 
    if (tempState === "") { return; }
    if (tempState === personalData.state) { return; }
    currentUser.changePersonalData('state', tempState);
    notifSuccess("State Updated", `Your state has been set to ${tempState}.`) 
  }

  function handleSubmitZip() { 
    if (tempZip === "") { return; }
    if (tempZip === personalData.zip) { return; }
    currentUser.changePersonalData('zip', tempZip);
    notifSuccess("Zip Code Updated", `Your zip code has been set to ${tempZip}.`) 
  }


  return (
    <div className="container-fluid px-0 py-2">
      <div className="row">
        <Text fz="xl" fw={500}>Personal Information</Text>
      </div>
      <div className="row">
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6" 
          label="Display Name"
          placeholder='Johnny Appleseed' 
          value={tempDisplayName} 
          onChange={e => setTempDisplayName(e.target.value)}
          onBlur={handleSubmitDisplayName}
          onKeyDown={handleDisplayNameKeyDown}
        />        
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6" 
          label="Email" 
          disabled 
          type='email'
          placeholder='hire@joed.dev' 
          value={currentUser.personalData.email}
        />        
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6" 
          label="Phone Number"
          placeholder='(202) 456-1111'
          value={tempPhoneNumber}
          type="tel"
          onChange={e => setTempPhoneNumber(e.target.value)}
          onBlur={handleSubmitPhoneNumber}
          onKeyDown={handlePhoneNumberKeyDown}
        />        
      </div>
      <div className="row">
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6"
          label="Address"
          placeholder='1600 Pennsylvania Avenue'
          value={tempAddress}
          onChange={e => setTempAddress(e.target.value)}
          onBlur={handleSubmitAddress}
          onKeyDown={handleAddressKeyDown}
        />
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6"
          label="City"
          placeholder='Washington'
          value={tempCity}
          onChange={e => setTempCity(e.target.value)}
          onBlur={handleSubmitCity}
          onKeyDown={handleCityKeyDown}
        />
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6"
          label="State"
          placeholder='District of Columbia' 
          value={tempState}
          onChange={e => setTempState(e.target.value)}
          onBlur={handleSubmitState}
          onKeyDown={handleStateKeyDown}
        />
        <TextInput
          className="col-12 col-lg-6 col-md-12 col-sm-6"
          label="Zip"
          placeholder='20500'
          value={tempZip}
          onChange={e => setTempZip(e.target.value)}
          onBlur={handleSubmitZip}
          onKeyDown={handleZipKeyDown}
        />
      </div>
    </div>
  )
})

export const GeneralSettings = memo(function GeneralSettings({general}) {
  
  const {currentUser} = useContext(CurrentUserContext);
  const [tempDarkmodeSetting, setTempDarkmodeSetting] = useState(general.darkMode)
  const [tempMeetingLink, setTempMeetingLink] = useState(general.meetingLink)
  
  function changeDarkmode() {
    const newValue = !general.darkMode
    updateAfterSwitchFlip(tempDarkmodeSetting, setTempDarkmodeSetting, () => {
      currentUser.changeSetting('darkMode', newValue);
      notifSuccess("Color Theme Updated", `Darkmode has been turned ${newValue ? "on" : "off"}.`)
    })
  }

  function handleMeetingLinkKeyDown(e) { if (e.key === "Enter") { handleMeetingLinkSubmit() } }

  function handleMeetingLinkSubmit() {
    if (tempMeetingLink === "") { return; }
    if (tempMeetingLink === general.meetingLink) { return; }
    if (!LinkMaster.checkValid(tempMeetingLink)) { notifFail("Invalid Link", "The link you entered is not valid."); return; }
    currentUser.changeSetting('meetingLink', tempMeetingLink);
    notifSuccess("Meeting Link Updated", `Your meeting link has been set to ${tempMeetingLink}.`)
  }

  return (
    <div className="py-2">
      <Text fz="xl" fw={500}>General Settings</Text>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Darkmode (In Progress)</Text>
          <Text size="xs" c="dimmed">
            Switch to the dark color scheme
          </Text>
        </div>
        <Switch onLabel="ON" offLabel="OFF" readOnly className="settings-switch" size='lg' checked={tempDarkmodeSetting} onClick={changeDarkmode}/>
      </Group>
      <TextInput
          className="col-12" 
          label="Meeting Link" 
          placeholder='https://www.meet.google.com/meet-with-my-coach/'
          type='url'
          value={tempMeetingLink}
          onChange={t => setTempMeetingLink(t.target.value)}
          onBlur={handleMeetingLinkSubmit}
          onKeyDown={handleMeetingLinkKeyDown}
      />      
    </div>
  )
})

export const SchoolSettings = memo(function SchoolSettings({schoolInfo}) {

  const {currentUser} = useContext(CurrentUserContext);
    
    const [tempAdvisorName, setTempAdvisorName] = useState(schoolInfo.advisorName)
    const [tempAdvisorHref, setTempAdvisorHref] = useState(schoolInfo.advisorHref)
    const [tempAdvisorEmail, setTempAdvisorEmail] = useState(schoolInfo.advisorEmail)
    const [tempAdvisorOffice, setTempAdvisorOffice] = useState(schoolInfo.advisorOffice)
    const [tempLMSHref, setTempLMSHref] = useState(schoolInfo.LMSHref)
    const [tempLMSName, setTempLMSName] = useState(schoolInfo.LMSName)

    function handleLMSNameChange(lms) {
      if (lms === null) { return; }
      setTempLMSName(lms);
      currentUser.changeSchoolInfo('LMSName', lms);
      notifSuccess("LMS Updated", `The Learning Management System has been set to "${lms}".`)
    }

    function handleLMSLinkChange(e) {
      const link = e.target.value
      setTempLMSHref(link);
      if (link.toLowerCase().includes("canvas")) { setTempLMSName(LMS.CANVAS); return; }
      if (link.toLowerCase().includes("blackboard")) { setTempLMSName(LMS.BLACKBOARD); return; }
      if (link.toLowerCase().includes("classroom")) { setTempLMSName(LMS.GOOGLE_CLASSROOM); return; }
      if (link.toLowerCase().includes("schoology")) { setTempLMSName(LMS.SCHOOLOGY); return; } 
      if (link.toLowerCase().includes("moodle")) { setTempLMSName(LMS.MOODLE); return; } 
      setTempLMSName(LMS.OTHER);
    }

    function handleLMSLinkKeyDown(e) { if (e.key === "Enter") { handleLMSLinkSubmit() } }
    function handleAdvisorNameKeyDown(e) { if (e.key === "Enter") { handleAdvisorNameSubmit() } }
    function handleAdvisorOfficeKeyDown(e) { if (e.key === "Enter") { handleAdvisorOfficeSubmit() } }
    function handleAdvisorEmailKeyDown(e) { if (e.key === "Enter") { handleAdvisorEmailSubmit() } }
    function handleAdvisorHrefKeyDown(e) { if (e.key === "Enter") { handleAdvisorHrefSubmit() } }

    function handleLMSLinkSubmit() {
      if (tempLMSHref === "") { return; }
      if (tempLMSHref === schoolInfo.LMSHref) { return; }
      currentUser.changeSchoolInfo('LMSHref', tempLMSHref);
      notifSuccess("LMS Link Updated", `The Learning Management System link has been set to ${tempLMSHref}.`)
      if (tempLMSName === schoolInfo.LMSName) { return; }
      currentUser.changeSchoolInfo('LMSName', tempLMSName);
    }

    function handleAdvisorNameSubmit() {
      if (tempAdvisorName === "") { return; }
      if (tempAdvisorName === schoolInfo.advisorName) { return; }
      currentUser.changeSchoolInfo('advisorName', tempAdvisorName);
      notifSuccess("Advisor Name Updated", `The advisor's name has been set to ${tempAdvisorName}.`)
    }

    function handleAdvisorHrefSubmit() {
      if (tempAdvisorHref === "") { return; }
      if (tempAdvisorHref === schoolInfo.advisorHref) { return; }
      currentUser.changeSchoolInfo('advisorHref', tempAdvisorHref);
      notifSuccess("Advisor Link Updated", `The advisor's link has been set to ${tempAdvisorHref}.`)
    }

    function handleAdvisorEmailSubmit() {
      if (tempAdvisorEmail === "") { return; }
      if (tempAdvisorEmail === schoolInfo.advisorEmail) { return; }
      currentUser.changeSchoolInfo('advisorEmail', tempAdvisorEmail);
      notifSuccess("Advisor Email Updated", `The advisor's email has been set to ${tempAdvisorEmail}.`)
    }

    function handleAdvisorOfficeSubmit() {
      if (tempAdvisorOffice === "") { return; }
      if (tempAdvisorOffice === schoolInfo.advisorOffice) { return; }
      currentUser.changeSchoolInfo('advisorOffice', tempAdvisorOffice);
      notifSuccess("Advisor Office Updated", `The advisor's office has been set to ${tempAdvisorOffice}.`)
    }

    return (
      <div className="container-fluid px-0 py-2">
        <div className="row">        
          <Text fz="xl" fw={500}>School Settings</Text>
        </div>
        <div className="row">
          <TextInput
            className="col-12 col-lg-6 col-md-12 col-sm-6" 
            label="Advisor Name" 
            placeholder='Talia Wendigo'
            value={tempAdvisorName}
            onChange={t => setTempAdvisorName(t.target.value)}
            onBlur={handleAdvisorNameSubmit}
            onKeyDown={handleAdvisorNameKeyDown}
          />        
          <TextInput
            className="col-12 col-lg-6 col-md-12 col-sm-6" 
            label="Advisor Link" 
            placeholder='https://www.myschool.edu/advisors/talia-wendigo'
            type='url'
            value={tempAdvisorHref}
            onChange={t => setTempAdvisorHref(t.target.value)}
            onBlur={handleAdvisorHrefSubmit}
            onKeyDown={handleAdvisorHrefKeyDown}
          />        
          <TextInput
            className="col-12 col-lg-6 col-md-12 col-sm-6" 
            label="Advisor Email" 
            placeholder='twendigo@myschool.edu'
            value={tempAdvisorEmail}
            onChange={t => setTempAdvisorEmail(t.target.value)}
            onBlur={handleAdvisorEmailSubmit}
            onKeyDown={handleAdvisorEmailKeyDown}
          />
          <TextInput
            className="col-12 col-lg-6 col-md-12 col-sm-6" 
            label="Advisor Office" 
            placeholder='The Woods and The Prairies'
            value={tempAdvisorOffice}
            onChange={t => setTempAdvisorOffice(t.target.value)}
            onBlur={handleAdvisorOfficeSubmit}
            onKeyDown={handleAdvisorOfficeKeyDown}
          />
        </div>
        <Group justify='space-between' align="flex-end" className="settings-item gap-2" wrap="nowrap" >
          <TextInput
            leftSection={<LMSIcon name={tempLMSName} />}
            className="w-100"
            label="LMS Link"
            type='url'
            placeholder='https://lms.myschool.edu/'
            value={tempLMSHref}
            onChange={handleLMSLinkChange}
            onBlur={handleLMSLinkSubmit}
            onKeyDown={handleLMSLinkKeyDown}
          />
          <Select label="LMS Name" data={[LMS.BLACKBOARD, LMS.CANVAS, LMS.GOOGLE_CLASSROOM, LMS.SCHOOLOGY, LMS.MOODLE, LMS.OTHER]} value={tempLMSName} onChange={handleLMSNameChange}/>
        </Group>
      </div>
    )
})

export const HomeworkTrackerSettings = memo(function HomeworkTrackerSettings({homeworkTrackerSettings}) {
    
  const {currentUser} = useContext(CurrentUserContext);

  function getPriorityVerbosityExampleText() {
    switch (homeworkTrackerSettings.priorityVerbosity) {
      case HomeworkPriorityVerbosity.VERBOSE:
        return "High Priority";
      case HomeworkPriorityVerbosity.COLORS:
        return "";
      case HomeworkPriorityVerbosity.MINIMAL:
        return "H";
      default:
        return "High";
    }
  }

  const [tempDeadlineHours, setTempDeadlineHours] = useState(homeworkTrackerSettings.ringDeadlineThresholdHours)

  function handleThresholdKeyDown(e) {
    if (e.key === "Enter") { handleSubmitThreshold() }
  }

  function handleSubmitThreshold() {
    currentUser.changeSetting('ringDeadlineThresholdHours', tempDeadlineHours);
    notifSuccess("Ring Deadline Threshold Updated", `The Assignment Tracker's ring deadline threshold has been set to ${tempDeadlineHours} hours.`)
  }

  function handleVerbosityChange(verbosity) {
    if (verbosity === null) { return; }
    currentUser.changeSetting('priorityVerbosity', verbosity);
    notifSuccess("Priority Verbosity Updated", `The priority verbosity has been set to "${verbosity}".`)
  }

  function handlePulseThresholdChange(threshold) {
    if (threshold === null) { return; }
    currentUser.changeSetting('priorityPulseThreshold', threshold);
    notifSuccess("Priority Pulse Threshold Updated", `The priority pulse threshold has been set to "${threshold}".`)
  }

  const [tempDeleteConfirmationSetting, setTempDeleteConfirmationSetting] = useState(homeworkTrackerSettings.requireHomeworkDeleteConfirmation)

  function handleDeleteConfirmationChange() {
    const newVal = !homeworkTrackerSettings.requireHomeworkDeleteConfirmation
    updateAfterSwitchFlip(tempDeleteConfirmationSetting, setTempDeleteConfirmationSetting, () => {
      currentUser.changeSetting('requireHomeworkDeleteConfirmation', newVal);
      notifSuccess("Delete Confirmation Updated", `You will ${newVal ? "now" : "no longer"} be asked to confirm before deleting an assignment.`)
    })
  }
  
  return (
    <div className="py-2">
      <Text fz="xl" fw={500}>Homework Tracker Settings</Text>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Priority Verbosity</Text>
          <Text size="xs" c="dimmed">
            How verbose should the priority indicators be?
          </Text>
        </div>
        <div className="d-flex gap-3 align-items-center">
          { homeworkTrackerSettings.priorityVerbosity !== HomeworkPriorityVerbosity.COLORS ? <Badge color="red">{getPriorityVerbosityExampleText()}</Badge> : <Indicator color="red" zIndex={1} processing /> }
          <Select data={[HomeworkPriorityVerbosity.COLORS, HomeworkPriorityVerbosity.MINIMAL, HomeworkPriorityVerbosity.DEFAULT, HomeworkPriorityVerbosity.VERBOSE]} defaultValue={homeworkTrackerSettings.priorityVerbosity} onChange={handleVerbosityChange}/>
        </div>
      </Group>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Priority Pulse Threshold</Text>
          <Text size="xs" c="dimmed">
            When verbosity is set to "Colors", at which priority do priority indicators begin to pulse?
          </Text>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <Indicator color="red" processing zIndex={1} />
          <Select disabled={homeworkTrackerSettings.priorityVerbosity !== HomeworkPriorityVerbosity.COLORS} data={[HomeworkPriority.HIGH, HomeworkPriority.MEDIUM, HomeworkPriority.LOW]} defaultValue={homeworkTrackerSettings.priorityPulseThreshold} onChange={handlePulseThresholdChange}/>
        </div>
      </Group>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Confirm Assignment Deletion</Text>
          <Text size="xs" c="dimmed">
            Require confirmation of a popup before assignments are allowed to be deleted
          </Text>
        </div>
        <Switch onLabel="ON" offLabel="OFF" readOnly className="settings-switch" size='lg' checked={tempDeleteConfirmationSetting} onClick={handleDeleteConfirmationChange}/>
      </Group>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Ring Deadline Threshold (Hours)</Text>
          <Text size="xs" c="dimmed">
            When set to "Deadline", the Assignment Tracker ring will include only assignments that are due within this many hours
          </Text>
        </div>
        <TextInput type="number" value={tempDeadlineHours} placeholder='24' onChange={e => setTempDeadlineHours(parseInt(e.target.value))} onBlur={handleSubmitThreshold} onKeyDown={handleThresholdKeyDown}/>
      </Group>
    </div>
  )
})

export const InvoiceSettings = memo(function InvoiceSettings({invoiceSettings}) {

  const {currentUser} = useContext(CurrentUserContext)

  const [tempStudentAccessibleSetting, setTempStudentAccessibleSetting] = useState(invoiceSettings.studentVisibility)
  const [tempPendingNotificationSetting, setTempPendingNotificationSetting] = useState(invoiceSettings.pendingStatusEmailNotification)
  const [tempNewNotificationSetting, setTempNewNotificationSetting] = useState(invoiceSettings.newInvoiceEmailNotification)

  function handleStudentVisibilityChange() {
    const newVal = !invoiceSettings.studentVisibility;
    updateAfterSwitchFlip(tempStudentAccessibleSetting, setTempStudentAccessibleSetting, () => {
      currentUser.changeInvoiceSetting('studentVisibility', newVal);
      notifSuccess("Student Access Updated", `Your student can now ${newVal ? "no longer" : ""} view and manage invoices.`)
    })
  }
  
  function handlePendingNotificationChange() {
    const newVal = !invoiceSettings.pendingStatusEmailNotification
    updateAfterSwitchFlip(tempPendingNotificationSetting, setTempPendingNotificationSetting, () => {
      currentUser.changeInvoiceSetting('pendingStatusEmailNotification', newVal);
      notifSuccess("Email Preferences Updated Updated", `You will now ${newVal ? "" : "no longer"} receive an email when the pending status of an invoice is updated.`)
    })
  }

  function handleNewNotificationChange() {
    const newVal = !invoiceSettings.newInvoiceEmailNotification
    updateAfterSwitchFlip(tempNewNotificationSetting, setTempNewNotificationSetting, () => {
      currentUser.changeInvoiceSetting('newInvoiceEmailNotification', newVal);
      notifSuccess("Email Preferences Updated Updated", `You will now ${newVal ? "" : "no longer"} receive an email when a new invoice is assigned to you.`)
    })
  }

  return (
    <div className="py-2">
      <Text fz="xl" fw={500}>Invoice Settings</Text>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Student Accessible (Coming Soon)</Text>
          <Text size="xs" c="dimmed">
            Allow my student to view and manage invoices
          </Text>
        </div>
        <Switch onLabel="ON" offLabel="OFF" readOnly className="settings-switch" size='lg' checked={tempStudentAccessibleSetting} onClick={handleStudentVisibilityChange}/>
      </Group>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>Pending Update Emails (Coming Soon)</Text>
          <Text size="xs" c="dimmed">
            Get an email notification when an invoice's pending status is updated
          </Text>
        </div>
        <Switch onLabel="ON" offLabel="OFF" readOnly className="settings-switch" size='lg' checked={tempPendingNotificationSetting} onClick={handlePendingNotificationChange}/>
      </Group>
      <Group justify='space-between' className="settings-item" wrap="nowrap" gap="xl">
        <div>
          <Text>New Invoice Emails (Coming Soon)</Text>
          <Text size="xs" c="dimmed">
            Get an email notification when a invoice is assigned to
          </Text>
        </div>
        <Switch onLabel="ON" offLabel="OFF" readOnly className="settings-switch" size='lg' checked={tempNewNotificationSetting} onClick={handleNewNotificationChange}/>
      </Group>
    </div>
  )
})

export const LinkSettings = memo(function LinkSettings({linkMemo}) {

  const {currentUser} = useContext(CurrentUserContext)

  const [linking, setLinking] = useState(false)

  function getCodeString(string) {
    return string.replace(/[^A-Z0-9]/ig, "").toUpperCase()
  }
  
  function checkThatCodeStringIsValid(string) {
    return string.match(/[^A-Z0-9]/ig) === null
  }

  const link = () => {
    const code = getCodeString(document.getElementById("sync-input").value)
    if (!code || code.length <= 0) {
      notifFail("Invalid Sync Code", "Sync code cannot be empty.")
      setLinking(false);
      return;
    }
    if (code === currentUser.syncCode) {
      notifFail("Cannot Link", "You cannot link your own account.")
      setLinking(false);
      return;
    }
    if (!checkThatCodeStringIsValid(code)) {
      notifFail("Invalid Sync Code", "Sync code can only contain capital letters and numbers.")
      setLinking(false);
      return;
    }
    setLinking(false)
    User.getSyncCodeOwner(code).then((u) => {
      if (u) {

        currentUser.linkAccount(u.id).then(() => {
          notifSuccess("Account Linked", `Account linked to ${u.personalData.displayName}.`)
        })
      
        const otherUser = User.getInstanceById(u.id)
        otherUser.fillData(u)
        otherUser.linkAccount(currentUser.id)
      }
    })

    currentUser.linkAccount()
  }


  const LinkedAccount = ({id}) => {
    const [userData, setUserData] = useState(null)
    useEffect(() => {
      User.getById(id).then((data) => { setUserData(data) })
    }, [id])
    if (!userData) { return <Skeleton /> }
    if (!userData.personalData) { return; }
    return <Paper withBorder className='w-100 mb-2 p-2 d-flex align-items-center justify-content-start gap-2'>
      <Avatar src={userData.personalData.pfpUrl} size="sm" />
      <Text fz="sm" fw={500}>{userData.personalData.displayName} ({userData.personalData.role})</Text>
    </Paper>
  }

  return (
    <div className="py-2">
      <Text fz="xl" fw={500}>Linked Accounts</Text>
      <div className="w-100 d-flex flex-column align-items-center justify-content-start h-100 pt-2">
        {currentUser?.linkedAccounts.map((id, index) => <LinkedAccount key={index} id={id} />)}
        {!linking && <Tooltip position="bottom" label="Link Account" onClick={() => setLinking(true)}>
          <IconPlus stroke={1.5} size="1rem" className="text-dimmed mt-2" style={{cursor: "pointer"}}/>
        </Tooltip>}
        {linking && <div className="d-flex align-items-center mt-2 justify-content-center w-100 gap-2"><TextInput id="sync-input" size="xs" c="dimmed" placeholder="Sync Code" onKeyDown={(e) => { if (e.key === "Enter") { link() } }} /><Tooltip label="Done"><IconCheck size="1rem" onClick={link} className="text-dimmed" /></Tooltip></div>}
      </div>
    </div>
  )
})