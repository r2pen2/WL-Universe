import { Table } from "@mantine/core";

export const FormTableHead = ({scrolled}) => (
  <Table.Thead className={"scroll-table-header " + (scrolled ? "scrolled" : "")}>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
      <Table.Th>Description</Table.Th>
      <Table.Th>Actions</Table.Th>
    </Table.Tr>
  </Table.Thead>
)