import { ActionIcon, Center, Paper, Progress, RingProgress, Tooltip } from '@mantine/core'
import { IconColumns, IconRefresh, IconTimeline } from '@tabler/icons-react'
import React from 'react'
import { CurrentUserContext } from '../../App'
import { HomeworkStatus } from '../../api/db/dbHomework.ts'
import { User } from '../../api/db/dbUser.ts'


const innerCircleRadius = 240
const outerCircleRadius = innerCircleRadius + 20

export const trackerOffset = outerCircleRadius + 10;

export const GreenCircle = () => (
  <svg width={innerCircleRadius} className="tracker-ring-svg" height={innerCircleRadius} style={{position: "absolute", top: 10, left: 10, border: "1px solid #00000022", borderRadius: "50%"}}>
    <circle cx={innerCircleRadius / 2} cy={innerCircleRadius / 2} r={innerCircleRadius / 2} className="green-space" />
  </svg>
)

export const WhiteSpace = () => (
  <svg width={outerCircleRadius} className="tracker-ring-svg" height={outerCircleRadius} style={{position: "absolute", top: 0, left: 0}}>
    <circle cx={outerCircleRadius / 2} cy={outerCircleRadius / 2} r={outerCircleRadius / 2} className="white-space" />
  </svg>
)



function getSections(currentUser, unitType, selectedSubjects) {
  const sections = [];
  const incompleteAssignments = currentUser.homework.filter(h => h.status !== HomeworkStatus.COMPLETED && selectedSubjects.includes(h.subject));
  const dueAssignments = currentUser.homework.filter(h => h.dueDate && h.dueDate?.seconds < ((Date.now()/1000) + currentUser.settings.ringDeadlineThresholdHours * 3600) && selectedSubjects.includes(h.subject) && h.status !== HomeworkStatus.COMPLETED);
  const subjects = {};

  let denominator = 1;

  if (unitType === "Forever") {
    denominator = incompleteAssignments.length;
    for (const hw of incompleteAssignments) {
      if (hw.subject in subjects) {
        subjects[hw.subject]++;
      } else {
        subjects[hw.subject] = 1;
      }
    }
  } else {
    for (const hw of dueAssignments) {
      denominator = dueAssignments.length;
      if (hw.subject in subjects) {
        subjects[hw.subject]++;
      } else {
        subjects[hw.subject] = 1;
      }
    }
  }

  for (const subjectKey of Object.keys(subjects)) {
    const count = subjects[subjectKey];
    const val = count * 100 / denominator;
    sections.push({value: val, color: currentUser.subjects[subjectKey].color});
  }

  return sections;
}

export default function TrackerRing({selectedSubjects, unitType, onGnatt, setOnGnatt, userOverride = null}) {

  const {currentUser} = React.useContext(CurrentUserContext)
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  return [
    <WhiteSpace key="white"/>,
    <GreenCircle key="green"/>,  
    <RingProgress
      key="ring-progress"
      className="ring"
      size={260}
      thickness={16}
      label={
        <Center>
          <Tooltip position='bottom' label={onGnatt ? "Switch to Table" : "Switch to Gnatt Chart"}>
            <ActionIcon className="line-icon" onClick={() => setOnGnatt(!onGnatt)} variant="light" size={innerCircleRadius - 80}>
              <IconRefresh size={80}/>
            </ActionIcon>
          </Tooltip>
        </Center>
      }
      sections={getSections(contextUser, unitType, selectedSubjects)}
    />
    ]
}

export function TrackerBar({selectedSubjects, unitType, userOverride = null}) {

  const {currentUser} = React.useContext(CurrentUserContext)
  const contextUser = userOverride ? User.getInstanceById(userOverride.id).fillData(userOverride) : currentUser;

  return <Paper withBorder className="d-block d-md-none" style={{marginTop: "-0.5rem", marginBottom: "0.5rem"}}>
    <Progress.Root >
      {getSections(contextUser, unitType, selectedSubjects).map((section, index) => <Progress.Section key={index} value={section.value} color={section.color}></Progress.Section>)}
    </Progress.Root>
  </Paper>
}