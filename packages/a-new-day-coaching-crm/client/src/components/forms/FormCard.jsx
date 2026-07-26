import { Card, Text, Group, Badge, Button, Progress } from '@mantine/core';
import { IconBackpack, IconCode, IconHeartHandshake, IconShieldCheckered } from '@tabler/icons-react';
import { pendingColor } from '../../tabs/Invoices';
import { hostname } from '../../api/db/dbManager.ts';
import { unpaidColor } from '../../api/color.ts';

const startedColor = pendingColor
const completedColor = null
const incompleteColor = unpaidColor

export function FormCard({form}) {

  function getBadgeColor() {
    if (!form.completed) {
      if (form.started) {
        return startedColor
      }
      return incompleteColor
    }
    return completedColor;
  }

  function getBadgeText() {
    if (!form.completed) {
      if (form.started) {
        return "Started"
      }
      return "Not Started"
    }
    return "Complete";
  }

  function getProressValue() {
    if (form.completed) {
      return 100
    }
    if (form.started) {
      return 50
    }
    return 0
  }

  function getButtonText() {
    if (form.completed) {
      return "Thanks!"
    }
    if (form.started) {
      return "Resume"
    }
    return "Start Now"
  }

  const FormIcon = () => {
    switch (form.formId) {
      case "webhookTestForm":
        return <IconCode style={{color: "var(--mantine-color-dimmed)"}}/>;
      case "parentGuardianForm":
        return <IconHeartHandshake style={{color: "var(--mantine-color-dimmed)"}}/>;
      case "concentForm":
        return <IconShieldCheckered style={{color: "var(--mantine-color-dimmed)"}}/>;
      case "studentForm":
        return <IconBackpack style={{color: "var(--mantine-color-dimmed)"}}/>;
      case "studentApplicationForm":
        return <IconBackpack style={{color: "var(--mantine-color-dimmed)"}}/>;
      default:
        return null;
    }
  }

  function openForm() {
    window.open(form.assignedLink, "_blank")
    fetch(hostname + "/forms/started", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({formId: form.formId, userId: form.assignedTo})}).catch(console.error)
  }

  return (
    <Card withBorder padding="lg" className="justify-content-between" radius="md" style={{minHeight: "100%"}}>
      
      <Card.Section className="form-card-section">
        <div className="d-flex align-item-center justify-content-between">      
          <FormIcon />
          <Badge color={getBadgeColor()}>{getBadgeText()}</Badge>
        </div>
        <div>
          <Text fz="lg" fw={500} mt="md">
            {form.formTitle}
          </Text>
          <Text fz="sm" c="dimmed" mt={5}>
            {form.formDescription}
          </Text>
        </div>
      </Card.Section>



      <Card.Section className="form-card-section">
        <Progress value={getProressValue()} className="mb-2" animated={form.started && !form.completed} color={form.started && !form.completed ? startedColor : null} />
        <Group gap={30}>
          <div>
            <Text fz="xl" fw={700} style={{ lineHeight: 1 }}>
              {form.minuteEstimate}
            </Text>
            <Text fz="sm" c="dimmed" fw={500} style={{ lineHeight: 1 }} mt={3}>
              minutes
            </Text>
          </div>

          <Button disabled={form.completed} color={form.started ? startedColor : null} radius="xl" style={{ flex: 1 }} onClick={openForm}>
            {getButtonText()}
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
}