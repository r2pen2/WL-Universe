import { Paper, TextInput } from "@mantine/core";
import ModuleHeader from "../dashboard/ModuleHeader";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { UserSearchResults } from "../Users";

export const UserSelect = ({selectedUser, setSelectedUser, allUsers}) => {
    
  const [userQuery, setUserQuery] = useState("");

  function handleTextChange(event) {
    if (selectedUser) { setSelectedUser(null) }
    setUserQuery(event.target.value);
  }

  return (
    <div className="col-xl-3 col-12 px-1">
      <Paper withBorder className="p-0 mb-2">
        <ModuleHeader>User Select</ModuleHeader>
        <div className="px-2 pb-2">
          <TextInput style={{marginBottom: "0.5rem", marginTop: "0.5rem"}} value={selectedUser ? `${selectedUser.personalData.displayName} (${selectedUser.personalData.role})` : userQuery} onChange={handleTextChange} placeholder="Search for a user by display name or email..." rightSection={selectedUser ? <IconX size="1rem" style={{cursor:"pointer"}} onClick={()=>setSelectedUser(null)} />  : <IconSearch size="1rem" />}/>
          <UserSearchResults showRole selectedUser={selectedUser} setSelectedUser={setSelectedUser} allUsers={allUsers} userQuery={userQuery} />
        </div>
      </Paper>
    </div>
  )
}