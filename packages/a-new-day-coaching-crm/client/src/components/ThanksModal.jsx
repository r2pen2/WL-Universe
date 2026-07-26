import { Modal, Text } from '@mantine/core'
import { useState } from 'react'

import "../assets/style/roleModal.css"

export default function RoleModal() {
  
  const [open, setOpen] = useState(window.location.hash.includes("thanks"))

  return (
    <Modal padding="md" opened={open} onClose={() => setOpen(false)}>
      <Text>Thanks for paying!</Text>
    </Modal>
  )
}
