// Library Imports
import React from 'react'
import { Avatar, Button, NumberInput, Paper, TextInput, Modal, Text } from '@mantine/core'
import { DateInput } from "@mantine/dates"
import { IconSearch } from '@tabler/icons-react'

// API Imports
import { Invoice, LimboInvoice, UnpaidInvoice, PaidInvoice } from '../api/db/dbInvoice.ts'
import { User } from '../api/db/dbUser.ts'

// Component Imports
import { navigationItems } from '../components/Navigation.jsx'
import { notifSuccess, notifFail } from '../components/Notifications.jsx'

// Style Imports
import '@mantine/dates/styles.css';
import ModuleHeader from '../components/dashboard/ModuleHeader.jsx'
import { UserSearchResults } from '../components/Users.jsx'
import { LimboTable, PaidTable, UnpaidTable } from '../components/invoiceManagement/InvoiceManagementTables.jsx'

export default function InvoiceManagement() {
  
  const [limboInvoices, setLimboInvoices] = React.useState([])
  const [unpaidInvoices, setUnpaidInvoices] = React.useState([])
  const [paidInvoices, setPaidInvoices] = React.useState([])
  function fetchInvoices() { 
    LimboInvoice.getAll().then((invoices) => { setLimboInvoices(invoices); })
    UnpaidInvoice.getAll().then((invoices) => { setUnpaidInvoices(invoices); })
    PaidInvoice.getAll().then((invoices) => { setPaidInvoices(invoices); })
  }

  const [allUsers, setAllUsers] = React.useState({});
  const [userQuery, setUserQuery] = React.useState("");
  const [dueDate, setDueDate] = React.useState(null)
  const [href, setHref] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [showEmailModal, setShowEmailModal] = React.useState(false)
  const [pendingEmailInvoice, setPendingEmailInvoice] = React.useState(null)
  React.useEffect(() => {
    fetchInvoices()
    User.fetchSearch(navigationItems.ADMININVOICES).then((users) => { setAllUsers(users); })
  }, [])

  function createInvoice(event) {
    event.preventDefault()

    if (selectedUser) {
      // User found - create invoice normally
      if (window.confirm(`Send ${selectedUser.personalData.displayName} an invoice for $${amount}?`)) {
        Invoice.create(href, amount, selectedUser, dueDate).then(() => {
          fetchInvoices()
          notifSuccess("Invoice Created", `Invoice sent to ${selectedUser.personalData.displayName}`)
          resetForm()
        })
      }
    } else if (userQuery.includes('@')) {
      // Looks like an email but no user found - offer email option
      setPendingEmailInvoice({
        href,
        amount,
        dueDate,
        email: userQuery
      })
      setShowEmailModal(true)
    } else {
      // No user selected and not an email
      notifFail("No User Selected", "Please select a user or enter an email address")
    }
  }

  function resetForm() {
    setHref("")
    setDueDate(null)
    setAmount("")
    setUserQuery("")
    setSelectedUser(null)
  }

  function handleEmailInvoiceConfirm() {
    if (pendingEmailInvoice) {
      Invoice.createWithEmail(
        pendingEmailInvoice.href, 
        pendingEmailInvoice.amount, 
        pendingEmailInvoice.email, 
        pendingEmailInvoice.dueDate
      ).then((response) => {
        fetchInvoices()
        if (response.emailSent) {
          notifSuccess("Invoice Created", `Invoice created and email sent to ${pendingEmailInvoice.email}`)
        } else {
          notifFail("Email Failed", `Invoice created but email failed to send to ${pendingEmailInvoice.email}`)
        }
        resetForm()
        setShowEmailModal(false)
        setPendingEmailInvoice(null)
      }).catch((error) => {
        console.error('Invoice creation failed:', error)
        notifFail("Invoice Creation Failed", "There was an error creating the invoice. Please try again.")
        setShowEmailModal(false)
        setPendingEmailInvoice(null)
      })
    }
  }

  const [selectedUser, setSelectedUser] = React.useState(null)

  function handleSearchChange(event) {
    if (selectedUser) { setSelectedUser(null) }
    setUserQuery(event.target.value)
  }

  const submitReady = dueDate && amount > 0 && href.length > 0 && userQuery.length > 0

  const AssignmentConfirmation = () => (
    <div className="d-flex flex-row justify-content-end align-items-center p-2 gap-2">
      { selectedUser && <Avatar src={selectedUser.personalData.pfpUrl} alt={selectedUser.personalData.displayName} />}
      { !selectedUser && userQuery.includes('@') && <span style={{fontSize: '0.9em', color: '#666'}}>{userQuery}</span>}
      <Button type="submit" disabled={!submitReady}>Create Invoice</Button>
    </div>
  )

  return (
    <div className='d-flex flex-column gap-2 p-0 align-items-center justify-content-center py-2 px-1 container-fluid'>
      <div className="row w-100">
        <div className="p-1 col-12 col-xl-3">
          <Paper withBorder className="p-0">
            <ModuleHeader>New Invoice</ModuleHeader>
            <form onSubmit={createInvoice} className="p-2 gap-2 d-flex flex-column">
              <TextInput id="href" label="Link" placeholder="Enter a link to the invoice" required value={href} onChange={(e) => setHref(e.target.value)} />
              <NumberInput id="amount" label="Amount" placeholder="Enter the invoice amount" required value={amount} leftSection="$" onChange={(v) => setAmount(parseInt(v))} />
              <DateInput value={dueDate} required label="Due Date" placeholder="Due date" onChange={setDueDate} />
              <TextInput label="User or Email" required style={{marginBottom: "1rem"}} value={selectedUser ? selectedUser.personalData.displayName : userQuery} onChange={handleSearchChange} placeholder="Search for a user by display name or enter an email address..." rightSection={<IconSearch size="1rem" />}/>
              <UserSearchResults selectedUser={selectedUser} setSelectedUser={setSelectedUser} allUsers={allUsers} userQuery={userQuery} />
              <AssignmentConfirmation />
            </form>
            
            <Modal opened={showEmailModal} onClose={() => {
              setShowEmailModal(false)
              setPendingEmailInvoice(null)
            }} title="No User Found">
              <Text mb="md">
                No user account was found for "{pendingEmailInvoice?.email}". 
                Would you like to send this invoice as an email? The recipient will be able to create an account to view and pay the invoice.
              </Text>
              <div className="d-flex gap-2 justify-content-end">
                <Button color="gray" onClick={() => {
                  setShowEmailModal(false)
                  setPendingEmailInvoice(null)
                }}>Cancel</Button>
                <Button onClick={handleEmailInvoiceConfirm}>Send Email Invoice</Button>
              </div>
            </Modal>
          </Paper>
        </div>
        <div className="col-xl-9 col-12 p-1">
          <div className="container-fluid p-0 px-2">
            <div className="row w-100">
              <UnpaidTable  invoices={unpaidInvoices} fetchInvoices={() => UnpaidInvoice.getAll().then( (invoices) => { setUnpaidInvoices(invoices);  })} />
              <PaidTable    invoices={paidInvoices}   fetchInvoices={() => PaidInvoice.getAll().then(   (invoices) => { setPaidInvoices(invoices);    })} />
              <LimboTable   invoices={limboInvoices}  fetchInvoices={() => LimboInvoice.getAll().then(  (invoices) => { setLimboInvoices(invoices);   })} />
            </div>
          </div>
        </div>
      </div>
      {/* <AssignModal /> */}
    </div>
  )
}