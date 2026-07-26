import { Button, Text } from '@nextui-org/react';
import React, { useEffect, useState } from 'react'
import {db} from '../api/firebase';
import { Timestamp } from 'firebase/firestore';

const params = new URLSearchParams(window.location.search)
const invoiceId = params.get('id')

function buyItemOne() {


  fetch('/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: invoiceId }),
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

export default function Payments() {
  
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    
    fetch("payments/getInvoiceById?id=" + invoiceId).then(res => {
      if (res.ok) { return res.json()}
      return res.json().then(json => Promise.reject(json))
    }).then(json => {
      setInvoice(json)
    }).catch(e => {
      console.error(e.error);
    })
  }, [])

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <Text>id: {invoiceId}</Text>
      <Text>name: {invoice?.name}</Text>
      <Text>unit_amount: {invoice?.unitAmount}</Text>
      <Text>quantity: {invoice?.quantity}</Text>
      {/* <Text>created_at: {invoice?.createdAt}</Text> */}
      <Text>paid: {invoice?.paid}</Text>
      {/* <Text>paid_at: {invoice?.paidAt}</Text> */}
      <Button onClick={buyItemOne}>
        Pay "{invoice?.name}" (${invoice?.unitAmount * invoice?.quantity / 100})
      </Button>
    </div>
  )
}
