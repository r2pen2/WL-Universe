import { Scheduler } from "@r2pen2/crm-gnatt";
import { Spoiler, Text, useMantineColorScheme } from "@mantine/core";
import { getOrthodoxDate } from "../../api/dates.ts";
import "@r2pen2/crm-gnatt/dist/style.css"

import "../../assets/style/gnatt.css"
import { getSlashDateString } from "../../api/strings.js";
import { notifWarn } from "../Notifications.jsx";
import { Homework } from "../../api/db/dbHomework.ts";

export const CRMGnatt = ({isLoading, assignments, userSubjects}) => {

  const gnattData = formatAssignmentDataForGnatt(assignments, userSubjects);

  const {colorScheme} = useMantineColorScheme()

  const NoDataNotif = () => {
    return (
      <div className="d-flex flex-row align-items-center justify-content-center p-5 w-100">
        <Text>You don't have any assignments that will show on the Gnatt cart: try adding something with both a <strong>start date</strong> and a <strong>due date</strong></Text>
      </div>
    )
  }

  const openHomework = (homework) => {
    if (!homework.href) { 
      notifWarn("Could not open assignment", "This assignment doesn't have a link attached to it!")
      return;
    }
    Homework.openLink(homework)
  }

  return (
    <Spoiler maxHeight={400} style={{minHeight: 400}} showLabel="Expand Gantt Chart" hideLabel="Collapse Gantt Chart">
      {gnattData.length > 0 && <Scheduler data={gnattData} isLoading={isLoading} zoom={0} dark={colorScheme !== "light"} onTileClick={(hw) => openHomework(hw)}/>}
      {gnattData.length <= 0 && <NoDataNotif />}
    </Spoiler>
  );
}

function formatAssignmentDataForGnatt(assignments, userSubjects) {

  assignments = assignments.filter(assignment => !assignment.completed && assignment.startDate && assignment.dueDate)

  const gnattData = [];

  function addSubject(subject) {
    const s = {
      id: subject,
      label: { title: subject, },
      data: []
    }
    gnattData.push(s)
    return s;
  }

  function getSubject(subject) {
    return gnattData.find((d) => d.id === subject);
  }

  for (const assignment of assignments) {
    let s = getSubject(assignment.subject);
    if (!s) {
      s = addSubject(assignment.subject);
      s.data.push({
        startDate: getOrthodoxDate(assignment.startDate),
        endDate: getOrthodoxDate(assignment.dueDate),
        title: assignment.description,
        bgColor: userSubjects[assignment.subject].color,
        description: `${getSlashDateString(getOrthodoxDate(assignment.startDate))} - ${getSlashDateString(getOrthodoxDate(assignment.dueDate))}`,
        href: assignment.href
      })
    }
  }

  return gnattData;
}