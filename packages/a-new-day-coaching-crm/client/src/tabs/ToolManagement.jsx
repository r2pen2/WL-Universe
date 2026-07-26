// Library Imports
import React, { useState } from 'react';
import { Avatar, AvatarGroup, Button, Checkbox, Modal, Paper, Table, Tabs, Text, TextInput, Tooltip } from '@mantine/core';
import { IconFilter, IconSearch, IconTrash, IconUsers } from '@tabler/icons-react';

// API Imports
import { Tool } from '../api/db/dbTool.ts';
import { User } from '../api/db/dbUser.ts';

// Component Imports
import { navigationItems } from '../components/Navigation.jsx';
import { notifSuccess } from '../components/Notifications.jsx';

// Style Imports
import "../assets/style/toolsAdmin.css";
import IconButton from '../components/IconButton.jsx';
import { CRMScrollContainer } from '../components/Tables.jsx';
import { ToolCreation } from '../components/toolManagement/ToolCreation.jsx';
import { ToolTableHead } from '../components/toolManagement/ToolsTable.jsx';
import { assignButtonColor, deleteButtonColor } from '../api/color.ts';


export default function ToolManagement() {

  /** Current tool to assign */
  const [currentTool, setCurrentTool] = React.useState(null);
  /** All tools from database */
  const [allTools, setAllTools] = React.useState({});
  /** All users from database (for search) */
  const [allUsers, setAllUsers] = React.useState({});
  /** Current string query to filter users */
  const [userQuery, setUserQuery] = React.useState("");
  /** All users currently selected for tool assignment */
  const [assignees, setAssignees] = React.useState([]);
  /** Whether we are in assign or unassign mode */
  const [assignMode, setAssignMode] = React.useState("Assign");
  /** Whether the table has been scrolled */
  const [scrolled, setScrolled] = useState(false);

  /** Fetch all tools from database */
  async function fetchTools() { await Tool.fetchAll().then((tools) => { setAllTools(tools); }) }

  /** Fetch tools and users on component mount */
  React.useEffect(() => {
    fetchTools()
    User.fetchSearch(navigationItems.ADMINTOOLS).then((users) => { setAllUsers(users); })
  }, [])

  /** Create tool on database w/ fields from form */
  function addTool(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    document.getElementById("name").value = "";
    document.getElementById("description").value = "";
    Tool.createOnDatabase(name, description).then(async (toolId) => {
      await fetchTools();
      notifSuccess("Tool Created", `Created "${name}"`);
      setCurrentTool({title: name, description: description, id: toolId})
      setAssignMode("Assign");
    })
  }

  const UserSearchResults = () => {

    // If there's no currentTool, we shouldn't render this component 
    if (!currentTool) { return; }

    let users = User.filterByDisplayNameAndEmail(Object.values(allUsers), userQuery)

    if (users.length === 0) { return <Text>No users found.</Text> } // There are no users that match this search, so don't bother with the rest of the logic here

    // Let's sort alphabetically by displayName, too
    User.sortByDisplayName(users)

    return (
      users.map((user, index) => {

        /** Toggle a userId's existance in assignee array */
        function toggleAssignee() {
          if (disablePaper) { return; } // Don't do anything if there are incompatibilities
          if (assignees.includes(user.id)) { setAssignees(assignees.filter((id) => id !== user.id)); return; }
          setAssignees([...assignees, user.id])
        }

        /** Whether the assignMode is "Assign" and the user already has the tool assigned */
        const assignIncompatibility = Object.keys(user.tools).includes(currentTool.id) && assignMode === "Assign";
        /** Whether the assignMode is "Unassign" and the user does not have the tool assigned */
        const unassignIncompatibility = !Object.keys(user.tools).includes(currentTool.id) && assignMode === "Unassign";

        /** Whether the paper should be disabled */
        const disablePaper = assignIncompatibility || unassignIncompatibility;

        /** Get the tooltip label based on the incompatibility */
        function getTooltip() {
          if (assignIncompatibility) { return `${user.personalData.displayName} already has this tool assigned.` }
          if (unassignIncompatibility) { return `${user.personalData.displayName} does not have this tool assigned.` }
          if (assignMode === "Assign") { return `Assign "${currentTool?.title}" to ${user.personalData.displayName}` }
          if (assignMode === "Unassign") { return `Unassign "${currentTool?.title}" from ${user.personalData.displayName}` }
        }

        return (
          <Paper key={index} onClick={toggleAssignee} className={`d-flex mb-2 flex-row justify-content-between align-items-center p-2 user-assignment-paper ${disablePaper ? "disabled" : ""}`} withBorder style={{cursor: "pointer"}} >
            <div className="d-flex flex-row align-items-center justify-content-center">
              <Avatar src={user.personalData.pfpUrl} alt={user.personalData.displayName} />
              <Text style={{marginLeft: "0.5rem"}}>{user.personalData.displayName}</Text>
            </div>
            <Tooltip label={getTooltip()} >
              <Checkbox readOnly checked={assignees.includes(user.id)} disabled={disablePaper} />
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
        Tool.assignToMultiple(currentTool.title, currentTool.description, currentTool.id, assignees).then((data) => {
          if (data) {
            setCurrentTool(null);
            setAssignees([]);
            notifSuccess("Tool Assigned", `Assigned "${currentTool.title}" to ${assignees.length} user${assignees.length !== 1 ? "s" : ""}.`)
            setAllTools(data);
          }
        })
        return;
      }
      Tool.unassignMultiple(currentTool.id, assignees).then((data) => {
        if (data) {
          setCurrentTool(null);
          setAssignees([]);
          notifSuccess("Tool Unassigned", `Unassigned "${currentTool.title}" from ${assignees.length} user${assignees.length !== 1 ? "s" : ""}.`)
          setAllTools(data);
        }
      })
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

  const ToolRow = ({tool}) => {

    /** Delete this tool on DB and refresh list */
    function handleDelete() {
      Tool.delete(tool.id).then((success) => {
        if (success) {
          fetchTools();
          notifSuccess("Tool Deleted", `Deleted "${tool.title}".`)
        }
      })
    }
  
    /** Confirm deletion of tool */
    function confirmDelete(skipConfirmation = false) { 
      const numAssigned = tool.assignedTo.length;
      if (skipConfirmation || window.confirm(`Are you sure you want to delete "${tool.title}"? It's assigned to ${numAssigned} user${numAssigned !== 1 ? "s" : '' }.`)) { handleDelete(); }
    }
  
    return (
      <Table.Tr>
        <Table.Td>{tool.title}</Table.Td>
        <Table.Td>{tool.description}</Table.Td>
        <Table.Td>{tool.assignedTo.length}</Table.Td>
        <Table.Td className='d-flex gap-2'>
          <IconButton icon={<IconUsers />} onClick={() => setCurrentTool(tool)} color={assignButtonColor} label={`Manage "${tool.title}" Users`} />
          <IconButton icon={<IconTrash />} color={deleteButtonColor} onClick={confirmDelete} onShiftClick={() => confirmDelete(true)} label={`Delete "${tool.title}"`} />
        </Table.Td>
      </Table.Tr>
    )
  }

  function handleAssignModeChange(value) {
    if (value !== assignMode) { setAssignees([]) }
    setAssignMode(value);
  }

  const [sort, setSort] = useState("title");
  const [sortReversed, setSortReversed] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const sortedTools = Tool.sortBy(Object.values(allTools), sort, sortReversed);
  const filteredSortedTools = sortedTools.filter((tool) => tool.title.toLowerCase().includes(filterQuery.toLowerCase()));

  return (
    <div className='d-flex flex-column gap-2 p-0 align-items-center justify-content-center py-2 px-1 container-fluid'>
      <div className="row w-100">
        <ToolCreation onSubmit={addTool}/>
        <div className="col-xl-9 col-12 px-1">
          <Paper withBorder className="w-100">
            <TextInput value={filterQuery} type="text" onChange={(e) => setFilterQuery(e.target.value)} placeholder="Filter by tool name..." style={{marginTop: "0.5rem", marginBottom: "0.5rem"}} className="px-2" rightSection={<IconFilter />} />
            <CRMScrollContainer setScrolled={setScrolled}>
              <Table striped>
                <ToolTableHead scrolled={scrolled} sort={sort} setSort={setSort} sortReversed={sortReversed} setSortReversed={setSortReversed}/>
                <Table.Tbody>
                  {filteredSortedTools.map((tool, index) => <ToolRow key={index} tool={tool} />)}
                </Table.Tbody>
              </Table>
            </CRMScrollContainer>
          </Paper>
        </div>
      </div>
      <Modal opened={currentTool} onClose={() => setCurrentTool(null)} title={`Actions for "${currentTool?.title}"`}>
        <Tabs defaultValue="Assign" onChange={(value) => handleAssignModeChange(value)}>
          <Tabs.List grow>
            <Tabs.Tab value="Assign">Assign</Tabs.Tab>
            <Tabs.Tab value="Unassign">Unassign</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <TextInput style={{marginBottom: "0.5rem", marginTop: "0.5rem"}} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search for a user by display name or email..." rightSection={<IconSearch size="1rem" />}/>
        <UserSearchResults />
        <Assignees />
      </Modal>
    </div>
  )
}