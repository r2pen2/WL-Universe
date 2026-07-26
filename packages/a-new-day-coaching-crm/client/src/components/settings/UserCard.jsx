import { Avatar, Button, Paper, Text } from "@mantine/core";
import { memo } from "react";
import { auth } from "../../api/firebase";
import { notifSuccess } from "../Notifications";

export const UserCard = memo(function UserCard({user}) {

  const getInitials = (name) => name ? name.split(" ").map((n) => n[0]).join("") : "??"

  const SettingsAvatar = () => user.pfpUrl ? <Avatar mx="auto" src={user.pfpUrl} alt={user.displayName} size={120} style={{marginBottom: "1rem"}} /> :  <Avatar mx="auto" alt={user.displayName} size={120} style={{marginBottom: "1rem"}}>{getInitials(user.displayName)}</Avatar>

  const handleSignOut = () => {
    auth.signOut().then(() => {
      window.location.hash = "dashboard"
    })
  }

  const copySync = () => {
    navigator.clipboard.writeText(user.syncCode)
    notifSuccess("Sync Code Copied", `Sync code for ${user.displayName} copied to clipboard.`)
  }

  return (
    <div className="col-12 col-md-6 col-lg-4 col-xxl-2 px-0 px-md-2 mb-2 ">
      <Paper withBorder p="lg" className="d-flex flex-column top-green align-items-center" bg="var(--mantine-color-body)">
        <SettingsAvatar />
        <Text ta="center" fz="lg" fw={500} mt="md">{user.displayName}</Text>
        <Text ta="center" fz="sm" c="dimmed">{user.role}</Text>
        <Text fz="sm" c="dimmed" mt="sm" tt="uppercase" fw={700}>Sync Code</Text>
        <Text fz="lg" fw={500} style={{cursor: "pointer"}} onClick={copySync}>{user.syncCode}</Text>
        <Button mt="md" onClick={handleSignOut}>Sign Out</Button>
      </Paper>
    </div>
  )
})