// Library Imports
import React, { useContext, useMemo } from 'react'
import { Paper } from '@mantine/core'

// Component Imports
import { CurrentUserContext } from '../App'
import { UserCard } from '../components/settings/UserCard.jsx'
import { GeneralSettings, HomeworkTrackerSettings, InvoiceSettings, PersonalInformationSettings, SchoolSettings, LinkSettings } from '../components/settings/SettingAdjustors.jsx'
import { UserRole } from '../api/db/dbUser.ts'

export default function Settings() {

  const {currentUser} = useContext(CurrentUserContext)
  const useDelegate = currentUser.delegate && (currentUser.personalData.role !== UserRole.DEVELOPER)
  const delegateUser = useDelegate ? currentUser.delegate : currentUser

  const userCardDataMemo = useMemo(() => ({
    displayName: currentUser.personalData.displayName,
    pfpUrl: currentUser.personalData.pfpUrl,
    role: currentUser.personalData.role,
    syncCode: currentUser.syncCode,
  }), [currentUser.personalData.pfpUrl, currentUser.personalData.displayName, currentUser.personalData.role, currentUser.syncCode])
  const personalDataMemo = useMemo(() => currentUser.personalData, [currentUser.personalData])
  const generalMemo = useMemo(() => ({darkMode: currentUser.settings.darkMode, meetingLink: delegateUser.settings.meetingLink}), [currentUser.settings.darkMode, delegateUser.settings.meetingLink])
  const schoolInfoMemo = useMemo(() => delegateUser.schoolInfo, [delegateUser.schoolInfo])
  const homeworkTrackerMemo = useMemo(() => ({
    priorityVerbosity: currentUser.settings.priorityVerbosity,
    priorityPulseThreshold: currentUser.settings.priorityPulseThreshold,
    requireHomeworkDeleteConfirmation: currentUser.settings.requireHomeworkDeleteConfirmation,
    ringDeadlineThresholdHours: currentUser.settings.ringDeadlineThresholdHours
  }), [currentUser.settings.priorityVerbosity, currentUser.settings.priorityPulseThreshold, currentUser.settings.requireHomeworkDeleteConfirmation, currentUser.settings.ringDeadlineThresholdHours])
  const invoiceSettingsMemo = useMemo(() => currentUser.settings.invoices, [currentUser.settings.invoices])

  return (
    <div className="d-flex flex-column gap-2 p-2 align-items-center justify-content-center container-fluid">
      <div className="row w-100">
        <UserCard user={userCardDataMemo}/>
        <div className="col-12 col-md-6 col-lg-8 col-xxl-10 px-0">
          <Paper withBorder p="lg" className="d-flex flex-column" bg="var(--mantine-color-body)">
            <PersonalInformationSettings personalData={personalDataMemo} />
            <GeneralSettings general={generalMemo} />
            <LinkSettings link={generalMemo} />
            <SchoolSettings schoolInfo={schoolInfoMemo} />
            {!useDelegate && <HomeworkTrackerSettings homeworkTrackerSettings={homeworkTrackerMemo} />}
            <InvoiceSettings invoiceSettings={invoiceSettingsMemo}/>
          </Paper>
        </div>
      </div>
    </div>
  )
}