// Library Imports
import { Avatar, AvatarGroup, Button, Checkbox, Modal, Paper, Table, Tabs, Text, TextInput, Tooltip } from '@mantine/core';
import { IconEye, IconSearch, IconUsers } from '@tabler/icons-react';
import React, { useState } from 'react';

// API Imports
import { User } from '../api/db/dbUser.ts';
import { allForms } from '../api/forms.ts';

// Component Imports
import { navigationItems } from '../components/Navigation.jsx';
import { notifSuccess } from '../components/Notifications.jsx';

// Style Imports
import "../assets/style/formsAdmin.css";
import IconButton from '../components/IconButton.jsx';
import { CRMScrollContainer } from '../components/Tables.jsx';
import { FormTableHead } from '../components/formManagement/formsTable.jsx';
import { LinkMaster } from '../api/links.ts';
import { acceptButtonColor, assignButtonColor, viewButtonColor } from '../api/color.ts';
// import { FormStats } from '../components/formManagement/formStats.jsx';

export default function FormManagement() {

  const [currentForm, setCurrentForm] = React.useState(null);

  const [allUsers, setAllUsers] = React.useState({});

  const [userQuery, setUserQuery] = React.useState("");
  const [assignees, setAssignees] = React.useState([]);

  const [assignMode, setAssignMode] = React.useState(null);

  React.useEffect(() => { User.fetchSearch(navigationItems.ADMINFORMS).then((users) => { setAllUsers(users); }) }, [])

  const UserSearchResults = () => {

    if (!currentForm) { return; } // Don't render if there's no form selected
    let users = Object.values(allUsers);

    if (userQuery.length > 0) {
      users = users.filter((user) => { return user.personalData.displayName.includes(userQuery) || user.personalData.email.includes(userQuery) })
    }

    // Let's sort alphabetically by displayName, too
    users.sort((a, b) => a.personalData.displayName.localeCompare(b.personalData.displayName))

    if (users.length === 0) {
      return <Text>No users found.</Text>
    }

    return (
      users.map((user, index) => {


        const userHasForm = allUsers[user.id].formAssignments.filter(fa => fa.formId === currentForm.formId).length > 0;
        const userCompletedForm = allUsers[user.id].formAssignments.filter(fa => fa.formId === currentForm.formId)[0]?.completed;

        function toggleAssignee() {
          if (disablePaper) { return; } // Don't do anything if there are incompatibilities
          // Otherwise add / remove the user from assignees
          if (assignees.includes(user.id)) { setAssignees(assignees.filter((id) => id !== user.id)) } else { setAssignees([...assignees, user.id]) }
        }


        /** Whether the assignMode is "Assign" and the user already has the form assigned */
        const assignIncompatibility = userHasForm && assignMode === "Assign";
        /** Whether the assignMode is "Unassign" and the user does not have the form assigned */
        const unassignIncompatibility = !userHasForm && assignMode === "Unassign";
        /** Whether the assignMode is "Incomplete" and the user has not completed the form */
        const incompleteIncompatibility = !userCompletedForm && assignMode === "Incomplete";

        function getTooltipLabel() {
          if (assignIncompatibility) { return `${user.personalData.displayName} already has this form assigned.` }
          if (unassignIncompatibility) { return `${user.personalData.displayName} does not have this form assigned.` }
          if (incompleteIncompatibility) { return `${user.personalData.displayName} has not completed this form.` }
          if (assignMode === "Assign") { return `Assign "${currentForm?.formTitle}" to ${user.personalData.displayName}` }
          if (assignMode === "Unassign") { return `Unassign "${currentForm?.formTitle}" from ${user.personalData.displayName}` }
          if (assignMode === "Incomplete") { return `Mark "${currentForm?.formTitle}" as incomplete for ${user.personalData.displayName}` }
        }

        /** Disable the paper and checkbox if there are any incompatibilities at all */
        const disablePaper = assignIncompatibility || unassignIncompatibility || incompleteIncompatibility;

        /** Whether to display checkbox as checked */
        const checked = assignees.includes(user.id);
        
        return (
          <Paper key={index} onClick={toggleAssignee} className={`d-flex mb-2 flex-row justify-content-between align-items-center p-2 user-assignment-paper ${disablePaper ? "disabled" : ""}`} withBorder style={{cursor: "pointer"}} >
            <div className="d-flex flex-row align-items-center justify-content-center">
              <Avatar src={user.personalData.pfpUrl} alt={user.personalData.displayName} />
              <Text style={{marginLeft: "0.5rem"}}>{user.personalData.displayName}</Text>
            </div>
            <Tooltip label={getTooltipLabel()} >
              <Checkbox readOnly checked={checked} disabled={disablePaper}/>
            </Tooltip>
          </Paper>
        )
      })
    )
  }

  const Assignees = () => {
    if (assignees.length === 0) { return; }
    
    function handleDone() {

      if (assignMode === "Assign") {
        currentForm.assignToMultiple(assignees).then((success) => {
          if (success) {
            setCurrentForm(null);
            notifSuccess("Form Assigned", `Assigned "${currentForm.formTitle}" to ${assignees.length} user${assignees.length !== 1 ? "s" : ""}.`)
          }
        })
        return;
      }

      if (assignMode === "Unassign") {
        currentForm.unassignToMultiple(assignees).then((success) => {
          if (success) {
            setCurrentForm(null);
            notifSuccess("Form Unassigned", `Unssigned "${currentForm.formTitle}" from ${assignees.length} user${assignees.length !== 1 ? "s" : ""}.`)
          }
        })
        return;
      }

      if (assignMode === "Incomplete") {
        currentForm.incompleteToMultiple(assignees).then((success) => {
          if (success) {
            setCurrentForm(null);
            notifSuccess("Form Marked Incomplete", `Marked "${currentForm.formTitle}" as incomplete for ${assignees.length} user${assignees.length !== 1 ? "s" : ""}.`)
          }
        })
        return;
      }

    }

    return (
      <div className="d-flex flex-row justify-content-end align-items-center p-2">
        <AvatarGroup>
          {assignees.map((userId, index) => {
            const user = allUsers[userId];
            return <Tooltip key={index} label={user.personalData.displayName}><Avatar src={user.personalData.pfpUrl} alt={user.personalData.displayName} /></Tooltip>
          })}
        </AvatarGroup>
        <Button style={{marginLeft: "1rem"}} onClick={handleDone}>Done</Button>
      </div>
    )
  }

  const [scrolled, setScrolled] = useState(false)

  function handleAssignModeChange(value) {
    if (value !== assignMode) { setAssignees([]) }
    setAssignMode(value);
  }

  return (
    <div className='d-flex flex-column gap-2 py-2 px-1 align-items-center justify-content-center container-fluid'>
      <div className="row w-100">
        {/* <FormStats /> */}
        <div className="col-12 px-1">
          <Paper withBorder className="w-100">
            <CRMScrollContainer setScrolled={setScrolled}>
              <Table striped>
                <FormTableHead scrolled={scrolled} />
                <Table.Tbody>
                  {allForms.sort((a, b) => a.formTitle.localeCompare(b.formTitle)).map((form, index) => {  
                    return (
                    <Table.Tr key={index}>
                      <Table.Td>
                        {form.formTitle}
                      </Table.Td>
                      <Table.Td>
                        {form.formDescription}
                      </Table.Td>
                      <Table.Td className='d-flex gap-2'>
                        <IconButton label={`Manage "${form.formTitle}" Users`} icon={<IconUsers />} color={assignButtonColor} onClick={() => {setCurrentForm(form); setAssignMode("Assign")}} />
                        <IconButton label={`Open "${form.formTitle}"`} icon={<IconEye />} color={viewButtonColor} onClick={() => window.open(LinkMaster.ensureAbsoluteUrl(form.href), "_blank")} />
                      </Table.Td>
                    </Table.Tr>
                  )})}
                </Table.Tbody>
              </Table>
            </CRMScrollContainer>
          </Paper>
        </div>
      </div>
      <Modal opened={currentForm} onClose={() => setCurrentForm(null)} title={`Actions for "${currentForm?.formTitle}"`}>
        <Tabs defaultValue="Assign" onChange={(value) => handleAssignModeChange(value)}>
          <Tabs.List grow>
            <Tabs.Tab value="Assign">Assign</Tabs.Tab>
            <Tabs.Tab value="Unassign">Unassign</Tabs.Tab>
            <Tabs.Tab value="Incomplete">Mark Incomplete</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <TextInput style={{marginBottom: "0.5rem", marginTop: "0.5rem"}} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search for a user by display name or email..." rightSection={<IconSearch size="1rem" />}/>
        <UserSearchResults />
        <Assignees />
      </Modal>
    </div>
  )
}
