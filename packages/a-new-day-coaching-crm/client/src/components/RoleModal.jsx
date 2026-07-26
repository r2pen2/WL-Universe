import { Card, Modal, Text } from '@mantine/core'
import React, { useContext } from 'react'
import { CurrentUserContext } from '../App'
import { IconBackpack, IconHome } from '@tabler/icons-react'

import "../assets/style/roleModal.css"
import { UserRole } from '../api/db/dbUser.ts'
import { notifSuccess } from './Notifications'

export default function RoleModal() {
  
  const {currentUser} = useContext(CurrentUserContext)

  const setStudent = () => {
    currentUser.personalData.role = UserRole.STUDENT
    currentUser.setData().then(() => {
      notifSuccess("Role Updated", "You are now a student!")
    })
  };

  const setParent = () => {
    currentUser.personalData.role = UserRole.PARENT
    currentUser.setData().then(() => {
      notifSuccess("Role Updated", "You are now a parent!")
    })
  };

  return (
    <Modal padding="md" opened={!currentUser.personalData.role} withCloseButton={false}>
      <Text>Hey there, {currentUser.personalData.displayName}! What's your role?</Text>
      <div className="container-fluid">
        <div className="row p-2">
          <div className="col-lg-6 col-12 p-2">
            <Card withBorder className="d-flex flex-column align-items-center justify-content-center hover-card" onClick={setStudent}>
              <IconBackpack />
              <Text>I am a student</Text>
            </Card>
          </div>
          <div className="col-lg-6 col-12 p-2">
            <Card withBorder className="d-flex flex-column align-items-center justify-content-center hover-card" onClick={setParent}>
              <IconHome />
              <Text>I am a parent</Text>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  )
}
