import { Table } from "@mantine/core";
import { TableSortButton } from "../Tables";

export const ToolTableHead = ({scrolled, sort, setSort, sortReversed, setSortReversed, hideNumber = false}) => {
  
  const handleSortChange = (newSort) => {
    if (sort === newSort) { setSortReversed(!sortReversed) } else { setSort(newSort); setSortReversed(false); }
  }

  return (
    <Table.Thead className={"scroll-table-header " + (scrolled ? "scrolled" : "")}>
      <Table.Tr>
        <Table.Th>
          <TableSortButton sorted={sort === "title"} reversed={sortReversed} onClick={() => handleSortChange("title")}>Name</TableSortButton>
        </Table.Th>
        <Table.Th>Description</Table.Th>
        {!hideNumber && <Table.Th w={90}>
          <TableSortButton sorted={sort === "users"} reversed={sortReversed} onClick={() => handleSortChange("users")}>Users</TableSortButton>
        </Table.Th>}
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
  )
}