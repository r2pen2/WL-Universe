import { LMS } from "../api/db/dbUser.ts"

import canvasLogo from "../assets/images/lms/canvas.svg"
import blackboardLogo from "../assets/images/lms/blackboard.svg"
import classroomLogo from "../assets/images/lms/classroom.svg"
import schoologyLogo from "../assets/images/lms/schoology.webp"
import moodleLogo from "../assets/images/lms/moodle-logo.png"
import { IconExternalLink } from "@tabler/icons-react"

export const LMSIcon = ({name, size = "1.25rem"}) => {
  const lmsIconStyle = {height: size, width: size}
  switch (name) {
    case LMS.BLACKBOARD:
      return <img src={blackboardLogo} alt="Blackboard" style={lmsIconStyle}/>
    case LMS.CANVAS:
        return <img src={canvasLogo} alt="Canvas" style={lmsIconStyle}/>
    case LMS.GOOGLE_CLASSROOM:
      return <img src={classroomLogo} alt="Google Classroom" style={lmsIconStyle}/>
    case LMS.SCHOOLOGY:
      return <img src={schoologyLogo} alt="Schoology" style={lmsIconStyle}/>
    case LMS.MOODLE:
      return <img src={moodleLogo} alt="Moodle" style={lmsIconStyle}/>
    default:
      return <IconExternalLink style={lmsIconStyle}/>
  }
}