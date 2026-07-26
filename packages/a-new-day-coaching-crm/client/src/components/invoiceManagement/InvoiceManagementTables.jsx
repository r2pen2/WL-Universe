import { NumberFormatter, Paper, Table, TextInput } from "@mantine/core";
import { CRMScrollContainer, TableSortButton } from "../Tables";
import IconButton from "../IconButton";
import { IconCheck, IconEye, IconFilter, IconTrash, IconX } from "@tabler/icons-react";
import { getSlashDateString, getTimeString } from "../../api/strings";
import { useState } from "react";
import ModuleHeader from "../dashboard/ModuleHeader";
import { LinkMaster } from "../../api/links.ts";
import { notifSuccess } from "../Notifications.jsx";
import { Invoice } from "../../api/db/dbInvoice.ts";
import { deleteButtonColor, viewButtonColor, acceptButtonColor } from "../../api/color.ts";
import { pendingColor } from "../../tabs/Invoices.jsx";

export const LimboTable = ({invoices, fetchInvoices}) => {
  
  const [sort, setSort] = useState("paidAt")
  const [sortReversed, setSortReversed] = useState(false)
  const [userQuery, setUserQuery] = useState("")

  const limboInvoices = Invoice.sortBy(Object.values(invoices), sort, sortReversed);
  const filteredLimboInvoices = Invoice.filterByUserQuery(limboInvoices, userQuery);
  
  const [scrolled, setScrolled] = useState(false);
  

  function handleSortChange(newSort) {
    return () => {
      if (sort === newSort) {
        setSortReversed(!sortReversed)
      } else {
        setSort(newSort)
        setSortReversed(false)
      }
    }
  }

  const LimboTableHead = () => (
    <Table.Thead className={"scroll-table-header " + (scrolled ? "scrolled" : "")}>
      <Table.Tr>
        <Table.Th><TableSortButton sorted={sort === "paidAt"} reversed={sortReversed} onClick={handleSortChange("paidAt")}>Timestamp</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "user"}   reversed={sortReversed} onClick={handleSortChange("user")}  >Submitted By</TableSortButton></Table.Th>
        <Table.Th>Platform</Table.Th>
        <Table.Th>Memo</Table.Th>
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
  )

  const LimboRow = ({invoice}) => {           
    function handleAccept() { invoice.accept().then(() => fetchInvoices()) }
    function handleReject() { invoice.reject().then(() => fetchInvoices()) }
  
    return (
      <Table.Tr>
        <Table.Td>{getSlashDateString(invoice.paidAt)} {getTimeString(invoice.paidAt)}</Table.Td>
        <Table.Td>{invoice.userDisplayName}</Table.Td>
        <Table.Td><strong style={{color: invoice.getPlatformColor()}}>{invoice.limbo}</strong></Table.Td>
        <Table.Td>{invoice.generateMemo()}</Table.Td>
        <Table.Td className='d-flex gap-2'>
          <IconButton icon={<IconCheck />} color={acceptButtonColor} onClick={handleAccept} label="Accept" />
          <IconButton icon={<IconX />} color={pendingColor} onClick={handleReject} label="Reject" />
        </Table.Td>
      </Table.Tr>
    )
  }

  return (
    <div className="col-12 p-1">
      <Paper withBorder>
        <ModuleHeader min>Pending Invoices</ModuleHeader>
        <TextInput value={userQuery} type="text" onChange={(e) => setUserQuery(e.target.value)} placeholder="Filter by user display name..." style={{marginTop: "0.5rem", marginBottom: "0.5rem"}} className="px-2" rightSection={<IconFilter />} />
        <CRMScrollContainer setScrolled={setScrolled}>
          <Table striped>
            <LimboTableHead scrolled={scrolled}/>
              <Table.Tbody>
                {filteredLimboInvoices.map((invoice, index) => <LimboRow invoice={invoice} key={index} />)}
              </Table.Tbody>
          </Table>
        </CRMScrollContainer>
      </Paper>
    </div>
  )
}

export const UnpaidTable = ({invoices, fetchInvoices}) => {
  
  const [sort, setSort] = useState("dueAt")
  const [sortReversed, setSortReversed] = useState(false)
  const [userQuery, setUserQuery] = useState("")

  const unpaidInvoices = Invoice.sortBy(Object.values(invoices), sort, sortReversed);
  const filteredUnpaidInvoices = Invoice.filterByUserQuery(unpaidInvoices, userQuery);
  
  const [scrolled, setScrolled] = useState(false);

  
  function handleSortChange(newSort) {
    return () => {
      if (sort === newSort) {
        setSortReversed(!sortReversed)
      } else {
        setSort(newSort)
        setSortReversed(false)
      }
    }
  }

  const UnpaidTableHead = () => (
    <Table.Thead className={"scroll-table-header " + (scrolled ? "scrolled" : "")}>
      <Table.Tr>
        <Table.Th><TableSortButton sorted={sort === "user"}       reversed={sortReversed} onClick={handleSortChange("user")}      >User</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "createdAt"}  reversed={sortReversed} onClick={handleSortChange("createdAt")} >Created</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "dueAt"}      reversed={sortReversed} onClick={handleSortChange("dueAt")}     >Due</TableSortButton></Table.Th>
        <Table.Th>Amount</Table.Th>
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
  )

  const UnpaidRow = ({invoice}) => {           
    function handleDelete(skipConfirmation = false) { 
      if (skipConfirmation || window.confirm(`Delete invoice from ${invoice.userDisplayName}?`)) {
        invoice.delete().then(() => {
          fetchInvoices();
          notifSuccess("Invoice Deleted", `Invoice for ${invoice.userDisplayName} deleted.`)
        })
      }
    }
    function handleView() { window.open(LinkMaster.ensureAbsoluteUrl(invoice.href), "_blank") }
  
    return (
      <Table.Tr>
        <Table.Td>{invoice.userDisplayName}</Table.Td>
        <Table.Td>{getSlashDateString(invoice.createdAt)}</Table.Td>
        <Table.Td>{getSlashDateString(invoice.dueAt)}</Table.Td>
        <Table.Td><NumberFormatter prefix="$" value={invoice.amount} /></Table.Td>
        <Table.Td className='d-flex gap-2'>
          <IconButton icon={<IconEye />} color={viewButtonColor} onClick={handleView} label="View" />
          <IconButton icon={<IconTrash />} color={deleteButtonColor} onClick={handleDelete} onShiftClick={() => handleDelete(true)} label="Delete" />
        </Table.Td>
      </Table.Tr>
    )
  }

  return (
    <div className="col-12 col-xl-6 px-1 mb-1">
      <Paper withBorder>
        <ModuleHeader min>Unpaid Invoices</ModuleHeader>
        <TextInput value={userQuery} type="text" onChange={(e) => setUserQuery(e.target.value)} placeholder="Filter by user display name..." style={{marginTop: "0.5rem", marginBottom: "0.5rem"}} className="px-2" rightSection={<IconFilter />} />
        <CRMScrollContainer height={300} setScrolled={setScrolled}>
          <Table striped>
            <UnpaidTableHead scrolled={scrolled}/>
              <Table.Tbody>
                {filteredUnpaidInvoices.map((invoice, index) => <UnpaidRow invoice={invoice} key={index} />)}
              </Table.Tbody>
          </Table>
        </CRMScrollContainer>
      </Paper>
    </div>
  )
}

export const PaidTable = ({invoices, fetchInvoices}) => {
  
  const [sort, setSort] = useState("paidAt")
  const [sortReversed, setSortReversed] = useState(false)
  const [userQuery, setUserQuery] = useState("")

  const paidInvoices = Invoice.sortBy(Object.values(invoices), sort, sortReversed);
  const filteredPaidInvoices = Invoice.filterByUserQuery(paidInvoices, userQuery);
  
  const [scrolled, setScrolled] = useState(false);


  function handleSortChange(newSort) {
    return () => {
      if (sort === newSort) {
        setSortReversed(!sortReversed)
      } else {
        setSort(newSort)
        setSortReversed(false)
      }
    }
  }

  const PaidTableHead = () => (
    <Table.Thead className={"scroll-table-header " + (scrolled ? "scrolled" : "")}>
      <Table.Tr>
        <Table.Th><TableSortButton sorted={sort === "user"}       reversed={sortReversed} onClick={handleSortChange("user")}      >User</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "createdAt"}  reversed={sortReversed} onClick={handleSortChange("createdAt")} >Created</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "dueAt"}      reversed={sortReversed} onClick={handleSortChange("dueAt")}     >Due</TableSortButton></Table.Th>
        <Table.Th><TableSortButton sorted={sort === "paidAt"}     reversed={sortReversed} onClick={handleSortChange("paidAt")}    >Paid</TableSortButton></Table.Th>
        <Table.Th>Amount</Table.Th>
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
  )

  const PaidRow = ({invoice}) => {           
    function handleDelete(skipConfirmation = false) { 
      if (skipConfirmation || window.confirm(`Delete invoice from ${invoice.userDisplayName}?`)) {
        invoice.delete().then(() => {
          fetchInvoices();
          notifSuccess("Invoice Deleted", `Invoice for ${invoice.userDisplayName} deleted.`)
        })
      }
    }
    function handleView() { window.open(LinkMaster.ensureAbsoluteUrl(invoice.href), "_blank") }
  
    return (
      <Table.Tr>
        <Table.Td>{invoice.userDisplayName}</Table.Td>
        <Table.Td>{getSlashDateString(invoice.createdAt)}</Table.Td>
        <Table.Td>{getSlashDateString(invoice.dueAt)}</Table.Td>
        <Table.Td>{getSlashDateString(invoice.paidAt)}</Table.Td>
        <Table.Td><NumberFormatter prefix="$" value={invoice.amount} /></Table.Td>
        <Table.Td className='d-flex gap-2'>
          <IconButton icon={<IconEye />} color={viewButtonColor} onClick={handleView} label="View" />
          <IconButton icon={<IconTrash />} color={deleteButtonColor} onClick={handleDelete} onShiftClick={() => handleDelete(true)} label="Delete" />
        </Table.Td>
      </Table.Tr>
    )
  }

  return (
    <div className="col-12 col-xl-6 mb-1 px-1">
      <Paper withBorder>
        <ModuleHeader min>Paid Invoices</ModuleHeader>
        <TextInput value={userQuery} type="text" onChange={(e) => setUserQuery(e.target.value)} placeholder="Filter by user display name..." style={{marginTop: "0.5rem", marginBottom: "0.5rem"}} className="px-2" rightSection={<IconFilter />} />
        <CRMScrollContainer height={300} setScrolled={setScrolled}>
          <Table striped>
            <PaidTableHead scrolled={scrolled}/>
              <Table.Tbody>
                {filteredPaidInvoices.map((invoice, index) => <PaidRow invoice={invoice} key={index} />)}
              </Table.Tbody>
          </Table>
        </CRMScrollContainer>
      </Paper>
    </div>
  )
}