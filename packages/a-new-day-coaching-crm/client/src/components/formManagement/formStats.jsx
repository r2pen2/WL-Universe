import { Box, Center, Group, Paper, RingProgress, Text } from "@mantine/core"
import { parentGuardianForm, webHookTestForm } from "../../api/forms.ts"
import ModuleHeader from '../dashboard/ModuleHeader.jsx';
import { IconBackpack, IconCode, IconHeartHandshake, IconShieldCheckered } from "@tabler/icons-react";


export const FormStats = ({formStats}) => {
  return (
    <div className="col-lg-3 col-12 px-1">
      <Paper withBorder className="p-0 pb-2 mb-2 container-fluid">
        <ModuleHeader>Form Stats</ModuleHeader>
        <Stat form={webHookTestForm} />
        <Stat form={parentGuardianForm} />
      </Paper>
    </div>
  )
}

const Stat = ({form}) => {
  
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
      default:
        return null;
    }
  }

  return (
    <Group className="px-2">
      <RingProgress
        size={80}
        roundCaps
        thickness={8}
        sections={[{ value: 50, color: "#74B496" }, { value: 15, color: "#22B8CF"}]}
        label={
          <Center>
            <FormIcon />
          </Center>
        }
      />
      <div className="d-flex flex-column">
        <Text fw={700}>
          {form.formTitle}
        </Text>
        <div className="d-flex gap-4">

          <Box style={{ borderBottomColor: "#74b495" }}>
            <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
              Completed
              </Text>
               <Group className="gap-2" align="flex-end" gap={0}>
               <Text c={"#74b496"} fw={700}>50%</Text>
            </Group>
          </Box>

          <Box style={{ borderBottomColor: "#22B8CF" }}>
            <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
              Started
              </Text>
               <Group className="gap-2" align="flex-end" gap={0}>
               <Text c={"#22B8CF"} fw={700}>15%</Text>
            </Group>
          </Box>

        </div>
      </div>
    </Group>
  )
}