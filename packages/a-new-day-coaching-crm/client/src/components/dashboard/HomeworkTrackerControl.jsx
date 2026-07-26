import { Paper, SegmentedControl, Text } from "@mantine/core"
import { CurrentUserContext } from "../../App"
import React from "react"

import "../../assets/style/homeworkTracker.css"

/** Selector for assignment sort order */
export const SortOrderSelector = ({setSortType, sortType}) => {
  return (
    <Paper withBorder className="pt-2 tracker-control-paper">
      <Text size="sm" fw={500} mb={3}>
        Sort Order
      </Text>
      <SegmentedControl className="w-100" onChange={setSortType} value={sortType} data={["Priority", "Due Date", "Start Date", "Subject"]} />
    </Paper>
  )
}

/**
 * Selector for showing / hiding completed assignments
 */
export const StatusSelector = ({showCompleted, setShowCompleted}) => {
  return (
    <Paper withBorder className="pt-2 tracker-control-paper">
      <Text size="sm" fw={500} mb={3}>
        Status
      </Text>
      <SegmentedControl className="w-100" data={["Incomplete", "All"]} value={showCompleted ? "All" : "Incomplete"} onChange={(e) => setShowCompleted(e === "All")} />
    </Paper>
  )
}

/** Selector for progress ring data */
export const RingContextSelector = ({unitType, setUnitType}) => {
  
  const {currentUser} = React.useContext(CurrentUserContext);

  return (
    <Paper withBorder className="pt-2 tracker-control-paper">
      <Text className="d-none d-md-block" size="sm" fw={500} mb={3}>
        Focus Ring
      </Text>
      <Text className="d-block d-md-none" size="sm" fw={500} mb={3}>
        Focus Bar
      </Text>
      <SegmentedControl className="w-100" data={["Forever", `Deadline (${currentUser.settings.ringDeadlineThresholdHours}hrs)`]} value={unitType} onChange={(newUnitType) => setUnitType(newUnitType)} />
    </Paper>
  )
}