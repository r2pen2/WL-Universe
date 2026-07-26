// Library Imports
import { Anchor, Button, Card, Group, Paper, SimpleGrid, Text, UnstyledButton, useMantineTheme } from "@mantine/core"
import React from "react"
// API Imports
import { LinkMaster } from "../../api/links.ts"
// Component Imports
import { CurrentUserContext } from "../../App"
// Style Imports
import "../../assets/style/paymentProcess.css";
import { notifSuccess } from "../Notifications.jsx";
import { unpaidColor } from "../../api/color.ts";
import { hostname } from "../../api/db/dbManager.ts";

const PayPalLogo = () => <svg role="img" viewBox="0 0 24 24" className="pay-modal-icon-svg" xmlns="http://www.w3.org/2000/svg"><title>PayPal</title><path d="M7.016 19.198h-4.2a.562.562 0 0 1-.555-.65L5.093.584A.692.692 0 0 1 5.776 0h7.222c3.417 0 5.904 2.488 5.846 5.5-.006.25-.027.5-.066.747A6.794 6.794 0 0 1 12.071 12H8.743a.69.69 0 0 0-.682.583l-.325 2.056-.013.083-.692 4.39-.015.087zM19.79 6.142c-.01.087-.01.175-.023.261a7.76 7.76 0 0 1-7.695 6.598H9.007l-.283 1.795-.013.083-.692 4.39-.134.843-.014.088H6.86l-.497 3.15a.562.562 0 0 0 .555.65h3.612c.34 0 .63-.249.683-.585l.952-6.031a.692.692 0 0 1 .683-.584h2.126a6.793 6.793 0 0 0 6.707-5.752c.306-1.95-.466-3.744-1.89-4.906z"/></svg>
const VenmoLogo = () => <svg role="img" viewBox="0 0 448 512" className="pay-modal-icon-svg" xmlns="http://www.w3.org/2000/svg"><title>Venmo</title><path d="M447.8 153.6c-2 43.6-32.4 103.3-91.4 179.1-60.9 79.2-112.4 118.8-154.6 118.8-26.1 0-48.2-24.1-66.3-72.3C100.3 250 85.3 174.3 56.2 174.3c-3.4 0-15.1 7.1-35.2 21.1L0 168.2c51.6-45.3 100.9-95.7 131.8-98.5 34.9-3.4 56.3 20.5 64.4 71.5 28.7 181.5 41.4 208.9 93.6 126.7 18.7-29.6 28.8-52.1 30.2-67.6 4.8-45.9-35.8-42.8-63.3-31 22-72.1 64.1-107.1 126.2-105.1 45.8 1.2 67.5 31.1 64.9 89.4z"/></svg>
const ZelleLogo = () => <svg role="img" viewBox="0 0 24 24" className="pay-modal-icon-svg" xmlns="http://www.w3.org/2000/svg"><title>Zelle</title><path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z"/></svg>
const PaidLogo = () => <svg xmlns="http://www.w3.org/2000/svg" className="pay-modal-icon-svg stroke icon icon-tabler icon-tabler-check" width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--icon-color)" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" fill='none' /></svg>
const StripeLogo = () => <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-credit-card-pay" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
<path d="M12 19h-6a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
<path d="M3 10h18" />
<path d="M16 19h6" />
<path d="M19 16l3 3l-3 3" />
<path d="M7.005 15h.005" />
<path d="M11 15h2" />
</svg>

const payButtonData = {
  paid: { color: "#00BF6F", text: <p>Mark Paid</p>, logo: <PaidLogo /> },
  payPal: { color: "#003087", text: <p>PayPal</p>, logo: <PayPalLogo /> },
  venmo: { color: "#008CFF", text: <p>Venmo</p>, logo: <VenmoLogo /> },
  zelle: { color: "#6D1ED4", text: <p>Zelle</p>, logo: <ZelleLogo /> },
  stripe: { color: "#008CDD", text: <p>Credit Card</p>, logo: <StripeLogo /> }
}

export const FirstPageV2 = ({secondPage, currentInvoice, setSecondPage}) => {

  /** Get the current user */
  const {currentUser} = React.useContext(CurrentUserContext);
  
  if (secondPage) { return; } // We're on the second page
  /** Link to venmo payment */
  const venmoLink = LinkMaster.createVenmoLink(currentInvoice?.amount, currentInvoice?.invoiceNumber, currentUser.personalData.displayName);
  
  /** When the stripe button is clicked, open the stripe payment modal */
  function handleStripe() {
    fetch(hostname + "/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: currentInvoice.id })
      }).then(res => {
        if (res.ok) { return res.json()}
        return res.json().then(json => Promise.reject(json))
      }).then(({session}) => {
        const url = session.url;
        console.log(session);
        window.location = url;
      }).catch(e => {
        console.error(e.error);
      })
  }

  return (  
    <>
      <Card withBorder radius="md" className="pay-modal-card">
        <Group justify="space-between">
          <Text className="pay-modal-title">Choose how to pay:</Text>
        </Group>
        <SimpleGrid cols={2} mt="md">
          <PayButtonV2 method="venmo"   color="#008CFF"   link={venmoLink}  onClick={() => setSecondPage("venmo")}  />
          {/* <PayButtonV2 method="zelle"   color="#6D1ED4"   link={LinkMaster.payments.zelle} onClick={() => setSecondPage("zelle")} /> */}
          {/* <PayButtonV2 method="stripe"  color="#003087"   link={LinkMaster.payments.stripe} onClick={handleStripe} /> */}
          <PayButtonV2 method="paid"    color="#00BF6F"                    onClick={() => setSecondPage("mark")}   />
        </SimpleGrid>
      </Card>
      <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
        <Anchor style={{ fontSize: '0.95em', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }} onClick={handleStripe}>
          or pay with your card
        </Anchor>
      </div>
    </>
  )
}
  
  export const SecondPage = ({secondPage, currentInvoice, setSecondPage, setCurrentInvoice, fetchInvoices}) => {
  
  /** Get the current user */
  const {currentUser} = React.useContext(CurrentUserContext);
  
  if (!secondPage) { return; } // We're on the first page

  const VenmoAndMarkActions = () => {

    if (!secondPage)                                                              { return; } // If we're not on the second page, don't show these action buttons
    if (secondPage !== "venmo" && secondPage !== "zelle" && secondPage !== "mark" && secondPage !== "oops") { return; } // If somehow we're on the wrong page, don't show these action buttons
    
    /** When the done button is pressed, tell Rachel that this invoice is paid & go to the right page */
    function handleDone() { 
      currentInvoice?.tellRachelIHaveBeenPaid(secondPage).then(() => {
        setSecondPage(`thanks-${secondPage}`);
        fetchInvoices();
        setCurrentInvoice(null);
        notifSuccess("Marked Paid", 'Your invoice has been marked as "paid" and is pending approval.');
      } );
    }
    
    const DoneButton = () => {
      if (secondPage === "oops") { return; } // Don't show the done button if we're undoing a mark
      return <Button key="done-button" style={{marginBottom: "0.5rem"}} color="green" onClick={handleDone}>{secondPage === "venmo" || secondPage === "zelle" ? "Done!" : "Yes, I've already paid."}</Button>
    }
    
    return [
      <DoneButton key="done-button" />,
      <Button key="back-button" onClick={() => { setSecondPage(null); setCurrentInvoice(null)}}>Close</Button>
    ]
  }

  /** When the user wants to undo a mark as paid, tell Rachel that this invoice is unpaid */
  function handleUndoMarkPaid() { 
    currentInvoice?.tellRachelIHaveNotBeenPaid().then(() => {
      setCurrentInvoice(null);
      fetchInvoices();
    });
  }

  const payMethod = secondPage === "venmo" ? "Venmo" : secondPage === "zelle" ? "Zelle" : "PayPal";
  const payColor = secondPage === "venmo" ? "#228BE6" : secondPage === "zelle" ? "#6D1ED4" : "#003087";

  return (
    <div className="row h-100 p-2 text-center">
      { (secondPage === "venmo" || secondPage === "zelle") && <p>Thanks for choosing to pay with <strong style={{color: payColor}}>{payMethod}</strong>! A new tab should have opened{secondPage === "venmo" && " with your payment already filled out"}. Click <strong>"Done!"</strong> when the payment has been sent, and I'll let Rachel know.</p> }
      { secondPage === "mark" && <p>Would you like me to inform Rachel that this invoice has already been paid?</p>}
      { secondPage === "cancel" && <p>Are you sure you want to mark this invoice as unpaid and cancel the approval process?</p>}
      <VenmoAndMarkActions />
      { secondPage === "thanks-venmo" && <p>You're all set! I've let Rachel know that you paid through <strong style={{color: "#228BE6"}}>Venmo</strong>. The table will update shortly once she's approved the payment.</p> }
      { secondPage === "thanks-mark" && <p>You're all set! I've let Rachel know that you've declared this invoice as paid. The table will update shortly once she's approved the payment.</p> }
      { (secondPage === "thanks-venmo" || secondPage === "thanks-mark") && <Button color="red"  style={{marginBottom: "0.5rem"}} onClick={handleUndoMarkPaid}>Wait! I Didn't mean to do that!</Button>}
      { (secondPage === "cancel") && <Button color={unpaidColor} style={{marginBottom: "0.5rem"}} onClick={handleUndoMarkPaid}>Mark unpaid</Button>}
      { (secondPage === "thanks-venmo" || secondPage === "thanks-mark") && <Button color="gray" onClick={() => setCurrentInvoice(null)}>Close</Button>}
      { (secondPage === "cancel") && <Button color="blue" onClick={() => setCurrentInvoice(null)}>Cancel</Button>}
    </div>
  )
  
}


export const PayButtonV2 = (props) => {
  

  /** When a payment method is clicked, open the href associated & propagate the onClick event */
  const handleClick = () => {
    if (props.onClick) { 
      props.onClick(); 
    }
    if (props.link) { 
      window.open(props.link, "_blank"); 
    }
  }
  
  return (
    <UnstyledButton onClick={handleClick} withBorder className="pay-modal-item p-3 d-flex flex-column align-items-center justify-content-center" style={{ "--icon-color": payButtonData[props.method].color }}>
      {payButtonData[props.method].logo}
      {payButtonData[props.method].text}
    </UnstyledButton>
  )
}