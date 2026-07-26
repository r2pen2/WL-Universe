import { Anchor, Avatar, Badge, Button, Center, Divider, Group, NumberInput, Paper, Popover, Select, Skeleton, Spoiler, Table, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAt, IconCheck, IconEye, IconForms, IconHome, IconMinus, IconNote, IconPencil, IconPhoneCall, IconPlus, IconRefresh, IconStar, IconStarOff, IconTrash, IconUserUp, IconUsers, IconX } from "@tabler/icons-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { User, UserRole } from "../../api/db/dbUser.ts";
import { notifFail, notifSuccess, notifWarn } from "../Notifications.jsx";
import { CurrentUserContext } from "../../App.jsx";
import { InvoiceList } from "../../tabs/Invoices.jsx";
import { Invoice } from "../../api/db/dbInvoice.ts";
import ModuleHeader from "../dashboard/ModuleHeader.jsx";
import { DateInput } from "@mantine/dates";
import { Tracker } from "../dashboard/HomeworkTrackerV2.jsx";
import { FormTableHead } from "../formManagement/formsTable.jsx";
import IconButton from "../IconButton.jsx";
import { allForms } from "../../api/forms.ts";
import { assignButtonColor, deleteButtonColor, unpaidColor, viewButtonColor } from "../../api/color.ts";
import { LinkMaster } from "../../api/links.ts";
import { Tool } from "../../api/db/dbTool.ts";
import { ToolTableHead } from "../toolManagement/ToolsTable.jsx";
import { DocSvg } from "../dashboard/DocumentsList.jsx";
import { Document, DocumentType } from "../../api/db/dbDocument.ts";
import { AddHomeworkModal, AddSubjectModal } from "../dashboard/HomeworkTrackerModals.jsx";
import { Resource } from "../../api/db/dbResource.ts";

export const PersonalData = ({user}) => {

  const dbUser = User.getInstanceById(user?.id)
  dbUser.fillData(user);
  
  const handleEmailEditClick = () => {
    setEditEmail(!editEmail)
  }
  
  const handlePhoneEditClick = () => {
    setEditPhone(!editPhone)
  }

  const handleSharedDocEditClick = () => {
    setEditSharedDoc(!editSharedDoc)
  }

  const handleAddressEditClick = () => {
    setEditAddress(!editAddress)
  }

  const [tempEmail, setTempEmail] = useState("")
  const [tempPhone, setTempPhone] = useState("")
  const [tempAdmin, setTempAdmin] = useState(false)
  const [tempSharedDoc, setTempSharedDoc] = useState("")
  const [tempAddress, setTempAddress] = useState("")
  const [tempCity, setTempCity] = useState("")
  const [tempState, setTempState] = useState("")
  const [tempZip, setTempZip] = useState("")

  useEffect(() => {
    setTempEmail(user?.personalData.email)
    setTempPhone(user?.personalData.phoneNumber)
    setTempRole(user?.personalData.role)
    setTempAdmin(user?.admin)
    setTempAddress(user?.personalData.address)
    setTempCity(user?.personalData.city)
    setTempState(user?.personalData.state)
    setTempZip(user?.personalData.zip)
    setTempSharedDoc(user?.schoolInfo?.sessionNotes?.length > 0 ? LinkMaster.ensureAbsoluteUrl(user?.schoolInfo.sessionNotes) : "Not Set")
  }, [user])
  
  const [editEmail, setEditEmail] = useState(false)
  const [editPhone, setEditPhone] = useState(false)
  const [editSharedDoc, setEditSharedDoc] = useState(false)
  const [editAddress, setEditAddress] = useState(false)

  const handleEmailEditKeyDown = (e) => { if (e.key === "Enter") { updateEmail() } }
  const handlePhoneEditKeyDown = (e) => { if (e.key === "Enter") { updatePhoneNumber() } }
  const handleSharedDocKeyDown = (e) => { if (e.key === "Enter") { updateSharedDoc() } }
  const handleAddressEditKeyDown = (e) => { if (e.key === "Enter") { updateAddress() } }
  const handleCityEditKeyDown = (e) => { if (e.key === "Enter") { updateAddress() } }
  const handleStateEditKeyDown = (e) => { if (e.key === "Enter") { updateAddress() } }
  const handleZipEditKeyDown = (e) => { if (e.key === "Enter") { updateAddress() } }

  const updateEmail = () => {
    if (tempEmail.length <= 0) { return; }
    if (tempEmail === user.personalData.email) { return; }
    setEditEmail(false)
    dbUser.personalData.email = tempEmail;
    dbUser.setData().then(() => {
      notifSuccess("Email Updated", `Email for ${user.personalData.displayName} updated to ${tempEmail}.`)
    });
  }
  
  const updateAddress = () => {
    if (tempAddress.length <= 0) { return; }
    if (tempAddress === user.personalData.address) { return; }
    setEditAddress(false)
    dbUser.personalData.address = tempAddress;
    dbUser.personalData.city = tempCity;
    dbUser.personalData.state = tempState;
    dbUser.personalData.zip = tempZip;
    dbUser.setData().then(() => {
      notifSuccess("Address Updated", `Address for ${user.personalData.displayName} updated to ${tempAddress}, ${tempCity} ${tempState}, ${tempZip}.`)
    });
  }

  const updatePhoneNumber = () => {
    if (tempPhone.length <= 0) { return; }
    if (tempPhone === user.personalData.phoneNumber) { return; }
    setEditPhone(false)
    dbUser.personalData.phoneNumber = tempPhone;
    dbUser.setData().then(() => { 
      notifSuccess("Phone Number Updated", `Phone number for ${user.personalData.displayName} updated to ${tempPhone}.`)
    });
  }
  
  const updateSharedDoc = () => {
    if (tempSharedDoc.length <= 0) { return; }
    if (tempSharedDoc === user.schoolInfo.sessionNotes) { return; }
    setEditSharedDoc(false)
    const absoluteUrl = LinkMaster.ensureAbsoluteUrl(tempSharedDoc);
    if (LinkMaster.checkValid(absoluteUrl)) {
      dbUser.schoolInfo.sessionNotes = tempSharedDoc;
      dbUser.setData().then(() => { 
        notifSuccess("Session Noted Link Updated", `Session notes link for ${user.personalData.displayName} updated to ${tempSharedDoc}.`)
      });
    } else {    
      setTempSharedDoc(user?.schoolInfo.sessionNotes?.length > 0 ? LinkMaster.ensureAbsoluteUrl(user?.schoolInfo.sessionNotes) : "Not Set")
      notifFail("Invalid Session Notes Link", "Please enter a valid link to a shared document.")
    }
  }

  const [tempRole, setTempRole] = useState(user?.personalData.role)
  
  function setRole(newRole) {
    setRolePopoverOpen(false)
    if (newRole === tempRole) { return; }
    setTempRole(newRole)
    dbUser.personalData.role = newRole;
    dbUser.setData().then(() => {
      notifSuccess("Role Updated", `Role for ${user.personalData.displayName} updated to ${newRole}.`)
    })
  }

  const [rolePopoverOpen, setRolePopoverOpen] = useState(false)

  const {currentUser} = useContext(CurrentUserContext)
  const isMe = currentUser?.id === user?.id;

  const revokeAdmin = () => {
    if (isMe) {
      notifWarn("Cannot Revoke Admin", "You cannot revoke your own admin status.")
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke admin status from ${user.personalData.displayName}?`)) { return; }
    dbUser.admin = false;
    setTempAdmin(false)
    dbUser.setData().then(() => {
      notifSuccess("Admin Status Revoked", `${user.personalData.displayName} is no longer an admin.`)
    })
  }
  
  const canBeAdmin = tempRole === UserRole.DEVELOPER || tempRole === UserRole.COACH
  
  const makeAdmin = () => {
    if (!canBeAdmin) {
      notifWarn("Cannot Make Admin", "Only coaches and developers can be made admins.")
      return;
    }
    if (!window.confirm(`Are you sure you want to make ${user.personalData.displayName} an admin?`)) { return;}
    setTempAdmin(true)
    dbUser.admin = true;
    dbUser.setData().then(() => {
      notifSuccess("Admin Status Granted", `${user.personalData.displayName} is now an admin.`)
    })
  }

  if (!user) { return; }
  return (
    <div className="col-12 col-lg-6 p-1">
      <Paper withBorder className="p-2 bg-gray-1 gap-2 d-flex flex-column align-items-center justify-content-lg-start justify-content-center">
        <div className="d-flex gap-2">
          <Avatar src={user.pfpUrl} alt={user.displayName} className="m-0" size={100} style={{marginBottom: "1rem"}} />
          <div className="d-flex flex-column justify-content-center">      
            <div className="d-flex gap-2 align-items-center">
              <Popover position="right" opened={rolePopoverOpen} onClose={() => setRolePopoverOpen(false)}>
                <Popover.Target style={{cursor: "pointer"}} onClick={() => setRolePopoverOpen(true)} >
                  <Text fz="sm" c="dimmed"  tt="uppercase" fw={700}>{tempRole ? tempRole : "no role"}</Text>
                </Popover.Target>
                <Popover.Dropdown className="p-0">
                  <Paper withBorder className="p-2 d-flex flex-column align-items-center justify-content-center">
                    <Anchor onClick={() => setRole(UserRole.STUDENT)} >Student</Anchor>
                    <Anchor onClick={() => setRole(UserRole.PARENT)}>Parent</Anchor>
                    <Anchor onClick={() => setRole(UserRole.COACH)} >Coach</Anchor>
                    <Anchor onClick={() => setRole(UserRole.DEVELOPER)} >Developer</Anchor>
                  </Paper>
                </Popover.Dropdown>
              </Popover>
              {tempAdmin && <Tooltip label="This account can manage tools, forms, invoices, and users."><Center><Badge rightSection={<IconX size="1rem" style={{cursor:!isMe ? 'pointer' : "not-allowed"}} onClick={revokeAdmin} />}>Admin</Badge></Center></Tooltip>}
              {!tempAdmin && <Tooltip label={canBeAdmin ? "Promote to Admin" : "Only COACH and DEVELOPER can promoted to admin"}><Center><IconUserUp size="1rem" style={{cursor:canBeAdmin ? 'pointer' : "not-allowed"}} className="text-dimmed" onClick={makeAdmin} /></Center></Tooltip>}
            </div>
            <Text fz="lg" fw={500}>{user.personalData.displayName}</Text>
            <Group wrap="nowrap" gap={10} mt={3}>
              <IconStar stroke={1.5} size="1rem" className="text-dimmed"/>
              <Text fz="xs" c="dimmed">"{user.intents[0]}"</Text>
            </Group>
          </div>
        </div>
        <Divider orientation="vertical" className="mx-2" />
        <div className="d-flex flex-column align-items-start justify-content-start">
          <Group wrap="nowrap" gap={10} mt={3}>
            <IconAt stroke={1.5} size="1rem" className="text-dimmed"/>
            {!editEmail && <Text fz="xs" c="dimmed">{tempEmail}</Text>}
            {editEmail && <TextInput size="xs" c="dimmed" value={tempEmail} onKeyDown={handleEmailEditKeyDown} onBlur={updateEmail} onChange={e => setTempEmail(e.target.value)}/>}
            <Tooltip label={!editEmail ? "Edit Email" : "Cancel"}>
              <Center>
                {!editEmail && <IconPencil onClick={handleEmailEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
                {editEmail && <IconX onClick={handleEmailEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
              </Center>
            </Tooltip>
          </Group>
          <Group wrap="nowrap" gap={10} mt={3}>
            <IconPhoneCall stroke={1.5} size="1rem" className="text-dimmed"/>
            {!editPhone && <Text fz="xs" c="dimmed">{tempPhone}</Text>}
            {editPhone && <TextInput size="xs" c="dimmed" value={tempPhone} onKeyDown={handlePhoneEditKeyDown} onBlur={updatePhoneNumber} onChange={e => setTempPhone(e.target.value)}/>}
            <Tooltip label={!editPhone ? "Edit Phone Number" : "Cancel"}>
              <Center>
                {!editPhone && <IconPencil onClick={handlePhoneEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
                {editPhone && <IconX onClick={handlePhoneEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
              </Center>
            </Tooltip>
          </Group>
          <Group wrap="nowrap" gap={10} mt={3}>
            <IconHome stroke={1.5} size="1rem" className="text-dimmed"/>
            {!editAddress && <Text fz="xs" c="dimmed">{user.personalData.address}, {user.personalData.city} {user.personalData.state}, {user.personalData.zip}</Text>}
            {editAddress && <TextInput size="xs" label="Address" c="dimmed" value={tempAddress} onKeyDown={handleAddressEditKeyDown} onBlur={updateAddress} onChange={e => setTempAddress(e.target.value)}/>}
            {editAddress && <TextInput size="xs" label="City" c="dimmed" value={tempCity} onKeyDown={handleCityEditKeyDown} onBlur={updateAddress} onChange={e => setTempCity(e.target.value)}/>}
            {editAddress && <TextInput size="xs" label="State" c="dimmed" value={tempState} onKeyDown={handleStateEditKeyDown} onBlur={updateAddress} onChange={e => setTempState(e.target.value)}/>}
            {editAddress && <TextInput size="xs" label="Zip" c="dimmed" value={tempZip} onKeyDown={handleZipEditKeyDown} onBlur={updateAddress} onChange={e => setTempZip(e.target.value)}/>}
            <Tooltip label={!editAddress ? "Edit Address" : "Cancel"}>
              <Center>
                {!editAddress && <IconPencil onClick={handleAddressEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
                {editAddress && <IconX onClick={handleAddressEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
              </Center>
            </Tooltip>
          </Group>
          <Group wrap="nowrap" gap={10} mt={3}>
            <IconNote stroke={1.5} size="1rem" className="text-dimmed"/>
            {!editSharedDoc && <Anchor href={LinkMaster.ensureAbsoluteUrl(tempSharedDoc)} target="_blank"><Text fz="xs" c="dimmed">{tempSharedDoc}</Text></Anchor>}
            {editSharedDoc && <TextInput size="xs" c="dimmed" value={tempSharedDoc} onKeyDown={handleSharedDocKeyDown} onBlur={updateSharedDoc} onChange={e => setTempSharedDoc(e.target.value)}/>}
            <Tooltip label={!editSharedDoc ? "Edit Session Notes Link" : "Cancel"}>
              <Center>
                {!editSharedDoc && <IconPencil onClick={handleSharedDocEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
                {editSharedDoc && <IconX onClick={handleSharedDocEditClick} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>}
              </Center>
            </Tooltip>
          </Group>
        </div>
      </Paper>
    </div>
  )
}

export const SyncData = ({user, changeSelectedUser, setFullUserData}) => {

  const dbUser = User.getInstanceById(user?.id)
  dbUser.fillData(user);

  const [tempSyncCode, setTempSyncCode] = useState(user?.syncCode)

  useEffect(() => {
    setTempSyncCode(user?.syncCode)
  }, [user])

  const [editSyncCode, setEditSyncCode] = useState(false)

  const regenSync = () => {
    dbUser.generateSyncCode().then((c) => {
      setTempSyncCode(c)
      dbUser.setData().then(() => {
        notifSuccess("Sync Code Regenerated", `Sync code for ${user.personalData.displayName} has been regenerated.`)
      })
    })
  }

  const handleSyncCodeKeyDown = (e) => { if (e.key === "Enter") { updateSyncCode() } }
  const updateSyncCode = () => {
    if (tempSyncCode.length <= 0) { 
      notifFail("Invalid Sync Code", "Sync code cannot be empty.")
      return;
    }
    if (!checkThatCodeStringIsValid(tempSyncCode)) {
      notifFail("Invalid Sync Code", "Sync code can only contain capital letters and numbers.")
      return;
    }
    if (tempSyncCode === user.syncCode) { return; }
    User.getSyncCodeOwner(tempSyncCode).then((codeUsed) => {
      if (!codeUsed) {
        dbUser.syncCode = tempSyncCode;
        dbUser.setData().then(() => {
          notifSuccess("Sync Code Updated", `Sync code for ${user.personalData.displayName} updated to ${tempSyncCode}.`)
          setEditSyncCode(false)
        })
      } else {
        notifFail("Sync Code Already Used", `Sync code ${tempSyncCode} is already in use by another user. Please choose a different code.`)
      }
    })
  }

  function getCodeString(string) {
    return string.replace(/[^A-Z0-9]/ig, "").toUpperCase()
  }
  
  function checkThatCodeStringIsValid(string) {
    return string.match(/[^A-Z0-9]/ig) === null
  }

  const [linking, setLinking] = useState(false)

  const link = () => {
    const code = getCodeString(document.getElementById("sync-input").value)
    if (!code || code.length <= 0) {
      notifFail("Invalid Sync Code", "Sync code cannot be empty.")
      setLinking(false);
      return;
    }
    if (code === user.syncCode) {
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

        dbUser.linkAccount(u.id).then(() => {
          notifSuccess("Account Linked", `Account linked to ${u.personalData.displayName}.`)
          setFullUserData(dbUser.clone());
        })
      
        const otherUser = User.getInstanceById(u.id)
        otherUser.fillData(u)
        otherUser.linkAccount(dbUser.id)
      }
    })
  }

  const copySync = () => {
    navigator.clipboard.writeText(tempSyncCode)
    notifSuccess("Sync Code Copied", `Sync code for ${user.personalData.displayName} copied to clipboard.`)
  }

  const removeSync = (otherUserId) => {
    
    User.getById(otherUserId).then((u) => {
      if (u) {
        
        dbUser.unlinkAccount(otherUserId).then(() => {
          notifSuccess("Account Unlinked", `Account unlinked from ${dbUser.personalData.displayName}.`)
          setFullUserData(dbUser.clone());
        })
      
        const otherUser = User.getInstanceById(u.id)
        otherUser.fillData(u)
        otherUser.unlinkAccount(dbUser.id)
      }
    })
  }

  if (!user) { return; }
  return (
    <div className="col-12 col-lg-6 p-1">
      <Paper withBorder className="h-100 p-2 bg-gray-1 gap-2 d-flex flex-row align-items-center justify-content-lg-start justify-content-center">
        <div className="w-100 d-flex flex-column align-items-center justify-content-start h-100 pt-2">
          <div className="d-flex flex-row gap-2">
            <Text fz="sm" c="dimmed" tt="uppercase" fw={700}>Sync Code</Text>
            {!editSyncCode && <Tooltip label="Regenerate Sync Code">
              <Center>
                <IconRefresh onClick={regenSync} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>
              </Center>
            </Tooltip>}
            {!editSyncCode && <Tooltip label="Set Sync Code">
              <Center>
                <IconPencil onClick={() => setEditSyncCode(true)} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>
              </Center>
            </Tooltip>}
          </div>
          {!editSyncCode && <Text fz="lg" fw={500} style={{cursor: "pointer"}} onClick={copySync}>{tempSyncCode}</Text>}
          <div className="d-flex gap-2">
            {editSyncCode && <TextInput size="xs" c="dimmed" value={tempSyncCode} onKeyDown={handleSyncCodeKeyDown} onBlur={updateSyncCode} onChange={e => setTempSyncCode(getCodeString(e.target.value))}/>}
            {editSyncCode && 
                <Tooltip label="Cancel">
                <Center>
                  <IconX onClick={() => setEditSyncCode(false)} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>
                </Center>
              </Tooltip>
            }
          </div>
        </div>
        <Divider orientation="vertical" className="mx-2" />
        <div className="w-100 d-flex flex-column align-items-center justify-content-start h-100 pt-2">
          <Text fz="sm" c="dimmed" tt="uppercase" fw={700}>Linked Accounts</Text>
          {user?.linkedAccounts.map((id, index) => <LinkedAccount removeSync={removeSync} changeSelectedUser={changeSelectedUser} key={index} id={id} />)}
          {!linking && <Tooltip position="bottom" label="Link Account" onClick={() => setLinking(true)}>
            <IconPlus stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>
          </Tooltip>}
          {linking && <div className="d-flex align-items-center justify-content-center w-100 gap-2"><TextInput id="sync-input" size="xs" c="dimmed" placeholder="Sync Code" onKeyDown={(e) => { if (e.key === "Enter") { link() } }} /><Tooltip label="Done"><IconCheck size="1rem" onClick={link} className="text-dimmed" /></Tooltip></div>}
        </div>
      </Paper>
    </div>
  )
}

export const LinkedAccount = ({id, changeSelectedUser, removeSync}) => {
  const [userData, setUserData] = useState(null)
  useEffect(() => {
    User.getById(id).then((data) => { setUserData(data) })
  }, [id])
  const handleLinkedUserClick = (e) => {
    e.preventDefault();
    changeSelectedUser(id)
  }
  if (!userData) { return <Skeleton /> }
  if (!userData.personalData) { return; }
  return (
    <div className="d-flex flex-row align-items-center gap-2 justify-content-center">
      <Anchor onClick={handleLinkedUserClick} className="gap-2 d-flex flex-row">
        <Text fz="sm" fw={500}>{userData.personalData.displayName} ({userData.personalData.role})</Text>
      </Anchor>
      <Tooltip label="Unlink">
        <Center>
          <IconTrash onClick={() => removeSync(id)} stroke={1.5} size="1rem" className="text-dimmed" style={{cursor: "pointer"}}/>
        </Center>
      </Tooltip>
    </div>
  )
}

export function InvoiceData({user, changeSelectedUser}) {
  
  const [invoices, setInvoices] = useState([]);
  const [invoicesPulled, setInvoicesPulled] = useState(false);
  
  useEffect(() => {
    if (!user) { return; }
    Invoice.getForUser(user.id).then((invoices) => { setInvoices(invoices); setInvoicesPulled(true); })
  }, [user])
  
  if (!user) { return; }

  if (user.personalData.role !== UserRole.STUDENT) {
    return (
      <div className="col-12 p-1">
        <Paper withBorder className="bg-dark-1 d-flex align-items-center flex-column gap-2">
          <Text>This is not a student account. Select a student to assign an invoice.</Text>
          {user?.linkedAccounts.map((id, index) => <LinkedAccount changeSelectedUser={changeSelectedUser} key={index} id={id} />)}
        </Paper>
      </div>
    )
  }

  function removeInvoice(id) {
    setInvoices(invoices.filter(i => i.id !== id))
  }

  return <div className="col-md-9 col-12 p-1">
    <Paper withBorder className="bg-dark-1">
      <ModuleHeader>Invoices</ModuleHeader>
      <Spoiler maxHeight={300} showLabel="Expand Invoices" hideLabel="Collapse Invoices">    
        <InvoiceList onlyDelete removeInvoiceFromMemo={removeInvoice} invoices={invoicesPulled ? invoices : []} />
      </Spoiler>
    </Paper>
  </div>
}

export function AddInvoice({user, setFullUserData}) {
  
  const [dueDate, setDueDate] = useState(null)
  const [href, setHref] = useState("")
  const [amount, setAmount] = useState("")
  
  function createInvoice(event) {
    event.preventDefault()

    setHref("")
    setDueDate(null)
    setAmount("")
    
    if (window.confirm(`Send ${user.personalData.displayName} an invoice for $${amount}?`)) {
      Invoice.createAndReturnId(href, amount, user, dueDate).then((id) => {
        notifSuccess("Invoice Created", `Invoice sent to ${user.personalData.displayName}`)
        user.invoices.push(id)
        setFullUserData({...user})
      })
    }
  }

  const checkDisabled = !user || !dueDate || amount <= 0 || href.length <= 0
  
  if (!user) { return; }
  if (user.personalData.role !== UserRole.STUDENT)  { return; }

  return <div className="col-md-3 col-12 p-1">
    <Paper withBorder className="bg-dark-1">
      <ModuleHeader>Send Invoice</ModuleHeader>
      <div className="p-2 d-flex flex-column gap-2 align-items-end">
        <TextInput className="w-100" id="href" label="Link" placeholder="Enter a link to the invoice" required value={href} onChange={(e) => setHref(e.target.value)} />
        <NumberInput className="w-100" id="amount" label="Amount" placeholder="Enter the invoice amount" required value={amount} leftSection="$" onChange={(v) => setAmount(parseInt(v))} />
        <DateInput className="w-100" value={dueDate} required label="Due Date" placeholder="Due date" onChange={setDueDate} />
        <Button type="submit" onClick={createInvoice} disabled={checkDisabled}>Send</Button>
      </div>
    </Paper>
  </div>

}

export const ManagementTracker = ({user, setFullUserData}) => {
  const [subjectAddMenuOpen, setSubjectAddMenuOpen] = useState(false)
  const [homeworkAddMenuOpen, setHomeworkAddMenuOpen] = useState(false)
  
  if (!user) { return; }
  if (user.personalData.role === UserRole.PARENT) { return; }

  return <div className="col-12 mt-3">
    
    <AddSubjectModal userOverride={user} setFullUserData={setFullUserData} open={subjectAddMenuOpen} close={() => setSubjectAddMenuOpen(false)} />
    <AddHomeworkModal userOverride={user} setFullUserData={setFullUserData} open={homeworkAddMenuOpen} close={() => setHomeworkAddMenuOpen(false)} />
    <Tracker userOverride={user} setFullUserData={setFullUserData} setHomeworkAddMenuOpen={setHomeworkAddMenuOpen} setSubjectAddMenuOpen={setSubjectAddMenuOpen} />
  </div>
}

export const FormsData = ({user, setFullUserData}) => {
  
  if (!user) { return; }

  return <div className="col-12 p-1">
    <Paper withBorder className="bg-dark-1">
      <ModuleHeader>Forms</ModuleHeader>
        <Table striped>
          <FormTableHead scrolled={false} />
          <Table.Tbody>
            {allForms.sort((a, b) => a.formTitle.localeCompare(b.formTitle)).map((form, index) => {
              let formData = user.formAssignments.filter(f => f.formId === form.formId);
              const hasForm = formData.length > 0
              formData = formData.filter(f => f.completed)
              const completedForm = formData.length > 0

              const assignForm = () => {
                form.assignToMultiple([user.id]).then((success) => {
                  if (success) {
                    notifSuccess("Form Assigned", `Assigned "${form.formTitle}" to ${user.personalData.displayName}.`)
                    User.getById(user.id).then((userData) => {
                      setFullUserData(userData)
                    })
                  }
                })
              }
              
              const unassignForm = () => {
                form.unassignToMultiple([user.id]).then((success) => {
                  if (success) {
                    notifSuccess("Form Unassigned", `Unssigned "${form.formTitle}" from ${user.personalData.displayName}.`)
                    User.getById(user.id).then((userData) => {
                      setFullUserData(userData)
                    })
                  }
                })
              }
              
              const markIncomplete = () => {
                form.incompleteToMultiple([user.id]).then((success) => {
                  if (success) {
                    notifSuccess("Form Marked Incomplete", `Marked "${form.formTitle}" as incomplete for ${user.personalData.displayName}.`)
                    User.getById(user.id).then((userData) => {
                      setFullUserData(userData)
                    })
                  }
                })
              }

              const goToForm = () => {
                window.open(LinkMaster.ensureAbsoluteUrl(form.href), "_blank")
              }

              return (
              <Table.Tr key={index}>
                <Table.Td>
                  {form.formTitle}
                </Table.Td>
                <Table.Td>
                  {form.formDescription}
                </Table.Td>
                <Table.Td className='d-flex gap-2'>
                  <IconButton label={`Open "${form.formTitle}"`} icon={<IconEye />} color={viewButtonColor} onClick={goToForm} />
                  {!hasForm && <IconButton label={`Assign "${form.formTitle}"`} icon={<IconPlus />} color={assignButtonColor} onClick={assignForm} />}
                  {hasForm && <IconButton label={`Unssign "${form.formTitle}"`} icon={<IconMinus />} color={deleteButtonColor} onClick={unassignForm} />}
                  {completedForm && <IconButton label={`Mark "${form.formTitle}" Incomplete`} icon={<IconRefresh />} color={unpaidColor} onClick={markIncomplete} />}
                </Table.Td>
              </Table.Tr>
            )})}
          </Table.Tbody>
        </Table>
    </Paper>
  </div>
}

export const ToolsData = ({user, setFullUserData}) => {

  
  const dbUser = User.getInstanceById(user?.id)
  
  const [allTools, setAllTools] = useState([]);
  
  useEffect(() => {
    Tool.fetchAll().then(data => setAllTools(Object.values(data)))
  }, [])

  const [search, setSearch] = useState("")

  let filteredTools = (search.length === 0) ? allTools : allTools.filter(tool => tool.title.toLowerCase().includes(search.toLowerCase())); 
  if (user) {
    filteredTools = filteredTools.filter(tool => !Object.keys(user.tools).includes(tool.id));
  }

  const ToolResult = ({tool}) => {

    function pushTool() {
      Tool.assignToMultiple(tool.title, tool.description, tool.id, [dbUser.id]).then((r) => {
        User.getById(user.id).then((userData) => {
          setFullUserData(userData)
        })
        notifSuccess("Tool Added", `Added "${tool.title}" to ${user.personalData.displayName}.`)
      });
    }

    return <Paper onClick={pushTool} className={`d-flex w-100 mt-1 flex-row justify-content-between align-items-center p-2`} withBorder style={{cursor: "pointer"}} >
      <div className="d-flex flex-row align-items-center justify-content-center">
        <Text size="sm">{tool.title}</Text>
      </div>
    </Paper>
  }

  if (!user) { return; }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-12 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>Add Tool</ModuleHeader>
            <div className="p-2 d-flex flex-column gap-2">
              <TextInput className="w-100" label="Add Tool" placeholder="Filter tools" required value={search} onChange={(e) => setSearch(e.target.value)} />
              <Spoiler maxHeight={200} showLabel="Expand Tools" hideLabel="Collapse Tools">
                {filteredTools.map((tool, index) => <ToolResult tool={tool} key={index} />)}
              </Spoiler>
            </div>
          </Paper>
        </div>
        <div className="col-12 col-md-9 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>Tools</ModuleHeader>
              <Spoiler maxHeight={300} showLabel="Expand Tools" hideLabel="Collapse Tools">
                <Table striped>
                  <ToolTableHead hideNumber scrolled={false} />
                  <Table.Tbody>
                    {Object.values(user.tools).sort((a, b) => a.title.localeCompare(b.title)).map((tool, index) => {
                    
                      const removeTool = () => {
                        delete user.tools[tool.id]
                        dbUser.fillData(user)
                        dbUser.setData().then(() => {
                          notifSuccess("Tool Removed", `Removed "${tool.title}" from ${user.personalData.displayName}.`)
                          User.getById(user.id).then((userData) => {
                            setFullUserData(userData)
                          })
                        })
                      }
                    
                      const starTool = () => {
                        tool.starred = !tool.starred
                        dbUser.fillData(user)
                        dbUser.setData().then(() => {
                          if (tool.starred) {
                            notifSuccess("Tool Starred", `Starred "${tool.title}" for ${user.personalData.displayName}.`)
                          } else {
                            notifSuccess("Tool Unstarred", `Unstarred "${tool.title}" for ${user.personalData.displayName}.`)
                          }
                          User.getById(user.id).then((userData) => {
                            setFullUserData(userData)
                          })
                        })
                      }
                    
                      return (
                        <Table.Tr key={index}>
                          <Table.Td>{tool.title}</Table.Td>
                          <Table.Td>{tool.description}</Table.Td>
                          <Table.Td className='d-flex gap-2'>
                            {tool.starred && <IconButton icon={<IconStarOff />} onClick={starTool} color="gray.5" label={`Unstar "${tool.title}"`} />}
                            {!tool.starred && <IconButton icon={<IconStar />} onClick={starTool} color="yellow.5" label={`Star "${tool.title}"`} />}
                            <IconButton icon={<IconMinus />} color={deleteButtonColor} onClick={removeTool} label={`Remove "${tool.title}"`} />
                          </Table.Td>
                        </Table.Tr>
                      )})}
                  </Table.Tbody>
                </Table>
              </Spoiler>
          </Paper>
        </div>
      </div>
    </div>
  )
}

export const DriveData = ({user, setFullUserData}) => {

  const dbUser = User.getInstanceById(user?.id)

  const [newHref, setNewHref] = useState("")
  const [tempType, setTempType] = useState(null)

  if (!user) { return; }

  const addDocument = () => {
    const absoluteUrl = LinkMaster.ensureAbsoluteUrl(newHref)
    if (newHref.length <= 0) { 
      notifFail("Cannot add Document", "Document link must not be empty.")
      return;
    }
    if (!LinkMaster.checkValid(absoluteUrl)) {
      notifFail("Invalid Document", "Invalid document link. Please ensure it's a valid URL.")
      return;
    }
    const existingDocument = user.documents.filter(d => d.href === newHref).length > 0;
    if (existingDocument) {
      notifFail("Cannot add Document", "Document already exists in your shared drive.")
      return;
    }
    const newDoc = new Document()
    newDoc.href = absoluteUrl;
    newDoc.extractData().then(() => {
      if (!tempType) {
        setTempType(newDoc.type)
      }
      user.documents.push(newDoc)
      dbUser.fillData(user)
      dbUser.setData().then(() => {
        notifSuccess("Document Added", `Added "${newDoc.title}" to ${user.personalData.displayName}.`)
        setFullUserData({...user})
        setNewHref("")
        setTempType(null)
      })
    })
  }

  const updateHref = (e) => {
    setNewHref(e.target.value)
    const docTypeExtracted = Document.getTypeFromURL(e.target.value)
    if (docTypeExtracted) {
      setTempType(docTypeExtracted)
    }
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-12 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>Add File</ModuleHeader>
            <div className="p-2 d-flex flex-column gap-2">
              <TextInput className="w-100" label="Add File" placeholder="Link to File" type="link" required value={newHref} onChange={updateHref} />
              <Select label="Document Type" value={tempType} required data={Object.values(DocumentType)} onChange={(e) => setTempType(e.target.value)} />
              <Button className="mt-2" onClick={addDocument}>Add</Button>
            </div>
          </Paper>
        </div>
        <div className="col-12 col-md-9 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>Shared Drive</ModuleHeader>
              <Spoiler maxHeight={300} showLabel="Expand Drive" hideLabel="Collapse Drive">
                <Table striped>
                  
                  
                  <Table.Thead className="scroll-table-header">
                    <Table.Tr>
                      <Table.Th>
                        Document
                      </Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {Object.values(user.documents).sort((a, b) => a.title.localeCompare(b.title)).map((doc, index) => {
                    
                      const removeDoc = () => {
                        user.documents = user.documents.filter(d => d.title !== doc.title && d.href !== doc.href);
                        dbUser.fillData(user)
                        dbUser.setData().then(() => {
                          notifSuccess("Document Removed", `Removed "${doc.title}" from ${user.personalData.displayName}.`)
                          User.getById(user.id).then((userData) => {
                            setFullUserData(userData)
                          })
                        })
                      }

                      const openDoc = () => {
                        window.open(LinkMaster.ensureAbsoluteUrl(doc.href), "_blank")
                      }
                    
                      return (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <div className="gap-2 d-flex flex-row align-items-center justify-content-start">
                              <DocSvg doc={new Document(doc)} />
                              <Text>{doc.title}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td className='d-flex gap-2'>
                            <IconButton icon={<IconEye />} color={viewButtonColor} onClick={openDoc} label={`Open "${doc.title}"`} />
                            <IconButton icon={<IconTrash />} color={deleteButtonColor} onClick={removeDoc} label={`Remove "${doc.title}"`} />
                          </Table.Td>
                        </Table.Tr>
                      )})}
                  </Table.Tbody>
                </Table>
              </Spoiler>
          </Paper>
        </div>
      </div>
    </div>
  )
}


export const ExternalData = ({user, setFullUserData}) => {

  const dbUser = User.getInstanceById(user?.id)

  const [newHref, setNewHref] = useState("")
  const [newTitle, setNewTitle] = useState("")

  if (!user) { return; }

  const addResource = () => {
    const absoluteUrl = LinkMaster.ensureAbsoluteUrl(newHref)
    if (newHref.length <= 0) { 
      notifFail("Cannot add Resource", "Resource link must not be empty.")
      return;
    }
    if (!LinkMaster.checkValid(absoluteUrl)) {
      notifFail("Invalid Link", "Invalid resource link. Please ensure it's a valid URL.")
      return;
    }
    const existingResource = user.resources.filter(r => r.href === newHref).length > 0;
    if (existingResource) {
      notifFail("Cannot add Resource", "Resource already exists.")
      return;
    }

    
    const newResource = new Resource()
    newResource.href = absoluteUrl;
    newResource.title = newTitle;
    user.resources.push(newResource)
    dbUser.fillData(user)
    dbUser.setData().then(() => {
      notifSuccess("Resource Added", `Added "${newResource.title}" to ${user.personalData.displayName}.`)
      setFullUserData({...user})
      setNewHref("")
      setNewTitle("")
    })

  }

  const updateHref = (e) => {
    setNewHref(e.target.value)
  }

  const updateTitle = (e) => {
    setNewTitle(e.target.value)
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-12 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>Add Resource</ModuleHeader>
            <div className="p-2 d-flex flex-column gap-2">
              <TextInput className="w-100" label="Add Resource" placeholder="Link to Resource" type="link" required value={newHref} onChange={updateHref} />
              <TextInput className="w-100" label="Title" placeholder="Resource Title" required value={newTitle} onChange={updateTitle} />
              <Button className="mt-2" onClick={addResource}>Add</Button>
            </div>
          </Paper>
        </div>
        <div className="col-12 col-md-9 p-1">
          <Paper withBorder className="bg-dark-1">
            <ModuleHeader>External Resources</ModuleHeader>
              <Spoiler maxHeight={300} showLabel="Expand Resources" hideLabel="Collapse Resources">
                <Table striped>
                  
                  
                  <Table.Thead className="scroll-table-header">
                    <Table.Tr>
                      <Table.Th>
                        Resource
                      </Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {Object.values(user.resources).sort((a, b) => a.title.localeCompare(b.title)).map((resource, index) => {
                    
                      const removeResource = () => {
                        user.resources = user.resources.filter(r => r.title !== resource.title && r.href !== resource.href);
                        dbUser.fillData(user)
                        dbUser.setData().then(() => {
                          notifSuccess("Resource Removed", `Removed "${resource.title}" from ${user.personalData.displayName}.`)
                          User.getById(user.id).then((userData) => {
                            setFullUserData(userData)
                          })
                        })
                      }

                      const openResource = () => {
                        window.open(LinkMaster.ensureAbsoluteUrl(resource.href), "_blank")
                      }
                    
                      return (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <div className="gap-2 d-flex flex-row align-items-center justify-content-start">
                              <img src={Resource.getSource(resource.href)} alt={resource.title} style={{width: 20, height: 20}} />
                              <Text>{resource.title}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td className='d-flex gap-2'>
                            <IconButton icon={<IconEye />} color={viewButtonColor} onClick={openResource} label={`Open "${resource.title}"`} />
                            <IconButton icon={<IconTrash />} color={deleteButtonColor} onClick={removeResource} label={`Remove "${resource.title}"`} />
                          </Table.Td>
                        </Table.Tr>
                      )})}
                  </Table.Tbody>
                </Table>
              </Spoiler>
          </Paper>
        </div>
      </div>
    </div>
  )
}