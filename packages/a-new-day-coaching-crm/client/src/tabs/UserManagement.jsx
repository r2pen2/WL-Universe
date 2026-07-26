import { Paper, Tabs } from '@mantine/core'
import React from 'react'
import { User, UserRole } from '../api/db/dbUser.ts';
import { navigationItems } from '../components/Navigation';
import ModuleHeader from '../components/dashboard/ModuleHeader.jsx';
import { UserSelect } from '../components/userManagement/UserManagementSelectPaper.jsx';
import { PersonalData, SyncData, InvoiceData, AddInvoice, ManagementTracker, FormsData, ToolsData, DriveData, ExternalData} from '../components/userManagement/UserData.jsx';


export default function UserManagement() {

  const [selectedUser, setSelectedUser] = React.useState(null);
  const [allUsers, setAllUsers] = React.useState({});

  React.useEffect(() => { User.fetchSearch(navigationItems.ADMINUSERS).then((users) => { setAllUsers(users); }) }, [])

  const [fullUserData, setFullUserData] = React.useState(null)
  
  React.useEffect(() => {
    if (selectedUser) {
      User.getById(selectedUser.id).then((userData) => {
        setFullUserData(userData)
      })
    } else {
      setFullUserData(null)
    }
  }, [selectedUser])

  function changeSelectedUser(id) {
    setSelectedUser(allUsers[id])
  }

  return (
    <div className='d-flex flex-column gap-2 p-0 align-items-center justify-content-center py-2 px-1 container-fluid'>
      <div className="row w-100">
        <UserSelect selectedUser={selectedUser} setSelectedUser={setSelectedUser} allUsers={allUsers} />
        <div className="col-xl-9 col-12 px-1">
          <Paper withBorder className="w-100 container-fluid px-0">
            <ModuleHeader>{selectedUser ? selectedUser.personalData.displayName : "No User Selected"}</ModuleHeader>
            <div className="row m-0">
              <PersonalData user={fullUserData} />
              <SyncData user={fullUserData} changeSelectedUser={changeSelectedUser} setFullUserData={setFullUserData} />
              {selectedUser && <Tabs defaultValue={selectedUser?.personalData.role !== UserRole.PARENT ? "assignments" : "invoices"}>
                <Tabs.List>
                  {selectedUser?.personalData.role !== UserRole.PARENT && <Tabs.Tab value="assignments">
                    Assignments
                  </Tabs.Tab>}
                  <Tabs.Tab value="invoices">
                    Invoices
                  </Tabs.Tab>
                  <Tabs.Tab value="forms">
                    Forms
                  </Tabs.Tab>
                  {selectedUser?.personalData.role !== UserRole.PARENT && <Tabs.Tab value="tools">
                    Tools
                  </Tabs.Tab>}
                  {selectedUser?.personalData.role !== UserRole.PARENT && <Tabs.Tab value="drive">
                    Google Drive
                  </Tabs.Tab>}
                  {selectedUser?.personalData.role !== UserRole.PARENT && <Tabs.Tab value="external">
                    External Resources
                  </Tabs.Tab>}
                </Tabs.List>
                <Tabs.Panel value="assignments">
                  <ManagementTracker user={fullUserData} setFullUserData={setFullUserData} />
                </Tabs.Panel>
                <Tabs.Panel value="invoices">
                  <div className="container-fluid">
                    <div className="row">
                      <AddInvoice user={fullUserData} setFullUserData={setFullUserData} />
                      <InvoiceData user={fullUserData} changeSelectedUser={changeSelectedUser} />
                    </div>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel value="forms">
                  <FormsData user={fullUserData} setFullUserData={setFullUserData} />
                </Tabs.Panel>
                <Tabs.Panel value="tools">
                  <ToolsData user={fullUserData} setFullUserData={setFullUserData} />
                </Tabs.Panel>
                <Tabs.Panel value="drive">
                  <DriveData user={fullUserData} setFullUserData={setFullUserData} />
                </Tabs.Panel>
                <Tabs.Panel value="external">
                  <ExternalData user={fullUserData} setFullUserData={setFullUserData} />
                </Tabs.Panel>
              </Tabs>}
            </div>
          </Paper>
        </div>
      </div>
    </div>
  )
}