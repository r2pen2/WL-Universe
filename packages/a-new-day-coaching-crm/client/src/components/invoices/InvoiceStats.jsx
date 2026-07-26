
import { Progress, Box, Text, Group, Paper, SimpleGrid, NumberFormatter } from '@mantine/core';
import { IconCreditCardPay } from '@tabler/icons-react';
import { lateColor, pendingColor } from '../../tabs/Invoices';
import { memo } from 'react';
import { unpaidColor } from '../../api/color.ts';
import ModuleHeader from '../dashboard/ModuleHeader';

export const InvoiceStats = memo(function InvoiceStats({invoices, invoicesPulled}) {

  const paidUp = getBalance() === 0 && getPendingBalance() === 0;

  const data = [
    { label: paidUp ? 'All paid up!' : "", count: paidUp ? `Thanks!` : "", part: paidUp ? 100 : 0, color: '#74b496' },
    { label: 'Late Unpaid', count: `${getLateBalance()}`, part: getLateBalance() * 100 / getUnpaidBalance(), color: lateColor },
    { label: 'Unpaid', count: `${getBalance() - getLateBalance()}`, part: (getBalance() - getLateBalance()) * 100 / getUnpaidBalance(), color: unpaidColor },
    { label: 'Pending', count: `${getPendingBalance()}`, part: getPendingBalance() * 100 / getUnpaidBalance(), color: pendingColor },
  ];

  const segments = data.map((segment) => (
    <Progress.Section value={segment.part} color={segment.color} key={segment.color}>
      {segment.part > 0 && <Progress.Label>
        {segment.count === "Thanks!" ? segment.count : <NumberFormatter prefix='$' value={segment.count} />}
      </Progress.Label>}
    </Progress.Section>
  ));

  const descriptions = data.map((stat) => {
    if (stat.part === 0 || isNaN(stat.part)) { return null; }
    return (
      <Box key={stat.label} style={{ borderBottomColor: stat.color }} className="invoice-stat-stat">
        <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
          {stat.label}
        </Text>
  
        <Group className="gap-2" align="flex-end" gap={0}>
          <Text c={stat.color} fw={700}>
            {stat.count !== "Thanks!" && <NumberFormatter prefix='$' value={stat.count} />}
          </Text>
        </Group>
      </Box>
    )
  });

  /** Get the total balance of all unpaid invoices minus those that are pending */
  function getBalance() { return invoices.filter(i => !i.paid && !i.paidAt).reduce((acc, i) => acc + parseInt(i.amount), 0); }
  /** Get the total balance of all unpaid invoices that are late minus those that are pending */
  function getLateBalance() { return invoices.filter(i => !i.paid && !i.paidAt && new Date(i.dueAt) < Date.now()).reduce((acc, i) => acc + parseInt(i.amount), 0); }
  /** Get the total balance of all unpaid invoices */  
  function getUnpaidBalance() { return invoices.filter(i => !i.paid).reduce((acc, i) => acc + parseInt(i.amount), 0); }
  /** Get the total balance of all pending invoices */
  function getPendingBalance() { return invoices.filter(i => !i.paid && i.paidAt).reduce((acc, i) => acc + parseInt(i.amount), 0); }
  

  function hasUnpaidInvoices() {
    return invoices.filter(i => !i.paid &&!i.paidAt).length > 0;
  }

  function hasPendingInvoices() {
    return invoices.filter(i => !i.paid && i.paidAt).length > 0;
  }

  function getUnpaidMessage() {
    if (!hasUnpaidInvoices() || !invoicesPulled) { return; }
    return <span>You can pay by clicking the <IconCreditCardPay /> button next to an invoice.</span>
  }

  function getPendingMessage() {
    if (!hasPendingInvoices() || !invoicesPulled) { return; }
    return "Pending invoices do not count towards your balance."
  }

  function getPaidMessage() {
    if (hasUnpaidInvoices() || hasPendingInvoices() || !invoicesPulled) { return; }
    return "There's nothing that you need to do here."
  }

  function getLateMessage() {
    if (getLateBalance() === 0 || !invoicesPulled) { return; }
    return <span>You have some <strong style={{color: "#fa5252"}}>late</strong> payments.</span>
  }

  return (   
    <Paper withBorder className="w-100">
      <ModuleHeader>Overview</ModuleHeader>
      <div className="p-2 d-flex flex-column gap-2">

      <Group justify="space-between">
        <div className="d-flex flex-column align-items-start">
          <Text fz="xl" fw={700}>
            <NumberFormatter value={getBalance()} prefix='$' />
          </Text>
          <Text c="dimmed">
            Is your current balance. { getPaidMessage() } { getUnpaidMessage() } { getPendingMessage() } { getLateMessage()  }
          </Text>
        </div>
      </Group>

      <Progress.Root size={34} classNames="invoice-stat-progress-label">
        { invoicesPulled && segments }
      </Progress.Root>

      <SimpleGrid cols={{ base: 1, xs: 3 }}>
        { invoicesPulled && descriptions }
      </SimpleGrid>
      </div>
    </Paper>
  );
})