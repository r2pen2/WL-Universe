import { Center, Group, ScrollArea, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconSelector } from "@tabler/icons-react";

export const CRMScrollContainer = (props) => (
  <ScrollArea h={props.height ? props.height : 600} onScrollPositionChange={({y}) => props.setScrolled(y !== 0)}>
    {props.children}
  </ScrollArea>
)

export const TableEmptyNotif = ({empty}) => {
  if (!empty) { return; }
  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100">
      <Text>Nothing to see here!</Text>
    </div>
  )
}

export const SortIcon = ({sorted, reversed}) => sorted ? (reversed ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />) : <IconSelector size="1rem" />;

export const SortControl = (props) => (
  <Group justify="space-between">
    <Text fw={500} fz="sm">
      {props.children}
    </Text>
    <Center>
      <SortIcon sorted={props.sorted} reversed={props.reversed} />
    </Center>
  </Group>
)

export const TableSortButton = (props) => (
  <UnstyledButton className="w-100" onClick={props.onClick}>
    <SortControl reversed={props.reversed} sorted={props.sorted}>
      {props.children}
    </SortControl>
  </UnstyledButton>
)