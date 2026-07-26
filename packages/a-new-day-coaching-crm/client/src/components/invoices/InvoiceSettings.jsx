import React, { useContext, memo, useState } from 'react'
import { CurrentUserContext } from '../../App'
import { Card, Group, Switch, Text } from '@mantine/core'
import "../../assets/style/invoices.css"
import { notifSuccess } from '../Notifications';
import { updateAfterSwitchFlip } from '../../api/settings.ts';
import ModuleHeader from '../dashboard/ModuleHeader.jsx';

const visibilityDisabled = false;
const newEmailDisabled = false;
const pendingEmailDisabled = false;

export const InvoiceSettings = memo(function InvoiceSettings({settings}) {

  return (
    <Card withBorder className='invoice-settings-card w-100 p-0'>
    <ModuleHeader>Invoice Settings</ModuleHeader>  
    <div className="d-flex flex-column p-2 gap-2">
      <VisibilitySetting settings={settings} />
      <PendingEmailNotificationSetting settings={settings} />
      <NewInvoiceEmailNotificationSetting settings={settings} />
    </div>
    </Card>
  )
})

const VisibilitySetting = ({settings}) => {
    
  const {currentUser} = useContext(CurrentUserContext)

  const [tempSetting, setTempSetting] = useState(settings.studentVisibility);
  
  function changeVisibility() {
    updateAfterSwitchFlip(tempSetting, setTempSetting, () => {
      currentUser.changeInvoiceSetting('studentVisibility', !settings.studentVisibility);
      notifSuccess("Student Access Updated", `Your student can now ${settings.studentVisibility ? "" : "no longer"} view and manage invoices.`)
    })
  }

  return (
    <Group justify='space-between' className="invoice-settings-item pb-2" wrap="nowrap" gap="xl">
      <div>
        <Text>Student Accessible (Coming Soon)</Text>
        <Text size="xs" c="dimmed">
          Allow my student to view and manage invoices
        </Text>
      </div>
      <Switch disabled={visibilityDisabled} onLabel="ON" offLabel="OFF" readOnly className="invoice-settings-switch" size='lg' checked={tempSetting} onClick={changeVisibility}/>
    </Group>
  )
}

const PendingEmailNotificationSetting = ({settings}) => {
    
  const {currentUser} = useContext(CurrentUserContext)

  const [tempSetting, setTempSetting] = useState(settings.pendingStatusEmailNotification)
  
  function changePendingNotificationSetting() {
    updateAfterSwitchFlip(tempSetting, setTempSetting, () => {
      currentUser.changeInvoiceSetting('pendingStatusEmailNotification', !settings.pendingStatusEmailNotification);
      notifSuccess("Email Preferences Updated Updated", `You will now ${settings.pendingStatusEmailNotification ? "" : "no longer"} receive an email when the pending status of an invoice is updated.`)
    })
  }

  return (
    <Group justify='space-between' className="invoice-settings-item pb-2" wrap="nowrap" gap="xl">
      <div>
        <Text>Pending Update Emails (Coming Soon)</Text>
        <Text size="xs" c="dimmed">
          Get an email notification when an invoice's pending status is updated
        </Text>
      </div>
      <Switch disabled={pendingEmailDisabled} onLabel="ON" offLabel="OFF" readOnly className="invoice-settings-switch" size='lg' checked={tempSetting} onClick={changePendingNotificationSetting}/>
    </Group>
  )
}

const NewInvoiceEmailNotificationSetting = ({settings}) => {
    
  const {currentUser} = useContext(CurrentUserContext)

  const [tempSetting, setTempSetting] = useState(settings.newInvoiceEmailNotification)
  
  function changeNewNotificationSetting() {
    updateAfterSwitchFlip(tempSetting, setTempSetting, () => {
      currentUser.changeInvoiceSetting('newInvoiceEmailNotification', !settings.newInvoiceEmailNotification);
      notifSuccess("Email Preferences Updated Updated", `You will now ${settings.newInvoiceEmailNotification ? "" : "no longer"} receive an email when a new invoice is assigned to you.`)
    })
  }

  return (
    <Group justify='space-between' className="invoice-settings-item pb-2" wrap="nowrap" gap="xl">
      <div>
        <Text>New Invoice Emails (Coming Soon)</Text>
        <Text size="xs" c="dimmed">
          Get an email notification when an invoice is assigned to you
        </Text>
      </div>
      <Switch disabled={newEmailDisabled} onLabel="ON" offLabel="OFF" readOnly className="invoice-settings-switch" size='lg' checked={tempSetting} onClick={changeNewNotificationSetting}/>
    </Group>
  )
}